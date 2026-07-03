"""Thin GitHub REST API proxy for project repo analytics.

Uses only the stdlib (urllib) so no extra dependency is needed. A token can be
supplied via the GITHUB_TOKEN env var to reach private repos and lift the
unauthenticated rate limit (60/hr -> 5000/hr).
"""
import json
import re
import urllib.error
import urllib.request

API = 'https://api.github.com'

_REPO_RE = re.compile(
    r'github\.com[/:]+([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$'
)


def parse_repo(url):
    """Extract (owner, repo) from a GitHub URL or SSH remote, or None."""
    if not url:
        return None
    m = _REPO_RE.search(url.strip())
    if not m:
        return None
    return m.group(1), m.group(2)


def _get(path, token):
    """Return (status_code, parsed_json_or_None)."""
    req = urllib.request.Request(f'{API}{path}')
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('User-Agent', 'fathul-dashboard')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = resp.read().decode('utf-8')
            data = json.loads(body) if body else None
            return resp.status, data
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode('utf-8'))
        except Exception:
            data = None
        return e.code, data
    except Exception:
        return 0, None


def fetch(url, token=None):
    """Fetch a bundle of analytics for the repo behind `url`.

    Returns a dict with keys: repo, ok, error, commit_activity, recent_commits.
    """
    parsed = parse_repo(url)
    if not parsed:
        return {'ok': False, 'error': 'not_a_github_repo'}
    owner, repo = parsed
    full = f'{owner}/{repo}'

    status, meta = _get(f'/repos/{owner}/{repo}', token)
    if status == 404:
        return {'ok': False, 'error': 'not_found', 'repo': full}
    if status == 403:
        return {'ok': False, 'error': 'rate_limited', 'repo': full}
    if status != 200 or not meta:
        return {'ok': False, 'error': 'unavailable', 'repo': full}

    license_obj = meta.get('license') or {}
    info = {
        'full_name': meta.get('full_name'),
        'html_url': meta.get('html_url'),
        'description': meta.get('description'),
        'homepage': meta.get('homepage'),
        'default_branch': meta.get('default_branch'),
        'created_at': meta.get('created_at'),
        'pushed_at': meta.get('pushed_at'),
        'updated_at': meta.get('updated_at'),
        'stargazers_count': meta.get('stargazers_count'),
        'watchers_count': meta.get('subscribers_count') or meta.get('watchers_count'),
        'forks_count': meta.get('forks_count'),
        'open_issues_count': meta.get('open_issues_count'),
        'language': meta.get('language'),
        'license': license_obj.get('spdx_id') if license_obj else None,
        'topics': meta.get('topics') or [],
        'size': meta.get('size'),
        'private': meta.get('private'),
    }

    # Language breakdown (bytes per language) → share for a stacked bar.
    _, langs = _get(f'/repos/{owner}/{repo}/languages', token)
    languages = langs if isinstance(langs, dict) else {}

    # 52 weeks of daily commit counts — the contribution-graph data.
    # This endpoint returns 202 while GitHub computes stats for the first time.
    act_status, activity = _get(f'/repos/{owner}/{repo}/stats/commit_activity', token)
    commit_activity = activity if act_status == 200 and isinstance(activity, list) else []
    computing = act_status == 202

    # Recent commits (default branch).
    _, commits = _get(f'/repos/{owner}/{repo}/commits?per_page=8', token)
    recent = []
    if isinstance(commits, list):
        for c in commits:
            commit = c.get('commit', {}) or {}
            author = commit.get('author', {}) or {}
            recent.append({
                'sha': (c.get('sha') or '')[:7],
                'message': (commit.get('message') or '').split('\n')[0],
                'author': author.get('name'),
                'date': author.get('date'),
                'html_url': c.get('html_url'),
            })

    # CI/CD — latest GitHub Actions runs.
    _, runs = _get(f'/repos/{owner}/{repo}/actions/runs?per_page=5', token)
    workflow_runs = []
    if isinstance(runs, dict):
        for r in runs.get('workflow_runs', [])[:5]:
            workflow_runs.append({
                'name': r.get('name'),
                'status': r.get('status'),          # queued | in_progress | completed
                'conclusion': r.get('conclusion'),  # success | failure | cancelled | None
                'branch': r.get('head_branch'),
                'event': r.get('event'),
                'html_url': r.get('html_url'),
                'created_at': r.get('created_at'),
            })

    # Open pull requests.
    _, pulls = _get(f'/repos/{owner}/{repo}/pulls?state=open&per_page=10', token)
    pull_requests = []
    if isinstance(pulls, list):
        for p in pulls:
            pull_requests.append({
                'number': p.get('number'),
                'title': p.get('title'),
                'user': (p.get('user') or {}).get('login'),
                'draft': p.get('draft'),
                'created_at': p.get('created_at'),
                'html_url': p.get('html_url'),
            })

    # Open issues (the issues endpoint also returns PRs — filter them out).
    _, issues = _get(f'/repos/{owner}/{repo}/issues?state=open&per_page=10', token)
    open_issues = []
    if isinstance(issues, list):
        for it in issues:
            if it.get('pull_request'):
                continue
            open_issues.append({
                'number': it.get('number'),
                'title': it.get('title'),
                'user': (it.get('user') or {}).get('login'),
                'comments': it.get('comments'),
                'created_at': it.get('created_at'),
                'html_url': it.get('html_url'),
            })

    return {
        'ok': True,
        'repo': full,
        'info': info,
        'languages': languages,
        'commit_activity': commit_activity,
        'computing': computing,
        'recent_commits': recent,
        'workflow_runs': workflow_runs,
        'pull_requests': pull_requests,
        'open_issues': open_issues,
    }
