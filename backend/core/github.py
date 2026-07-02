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

    info = {
        'full_name': meta.get('full_name'),
        'html_url': meta.get('html_url'),
        'description': meta.get('description'),
        'default_branch': meta.get('default_branch'),
        'pushed_at': meta.get('pushed_at'),
        'updated_at': meta.get('updated_at'),
        'stargazers_count': meta.get('stargazers_count'),
        'forks_count': meta.get('forks_count'),
        'open_issues_count': meta.get('open_issues_count'),
        'language': meta.get('language'),
        'private': meta.get('private'),
    }

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

    return {
        'ok': True,
        'repo': full,
        'info': info,
        'commit_activity': commit_activity,
        'computing': computing,
        'recent_commits': recent,
    }
