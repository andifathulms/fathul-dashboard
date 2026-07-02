"""Web availability check for a URL — stdlib only (urllib + ssl)."""
import datetime
import socket
import ssl
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse


def check_url(url):
    """Return a dict of availability info for `url`.

    Keys: is_up, status_code, response_ms, error, server, content_type,
    final_url, ssl_days_left.
    """
    result = {
        'is_up': False,
        'status_code': None,
        'response_ms': None,
        'error': '',
        'server': '',
        'content_type': '',
        'final_url': '',
        'ssl_days_left': None,
    }
    parsed = urlparse(url)

    # Reachability + status. Use an unverified context so an expired/self-signed
    # cert still reports "up" (reachable); the cert health is reported separately.
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    start = time.time()
    try:
        req = urllib.request.Request(
            url, method='GET', headers={'User-Agent': 'fathul-dashboard-uptime'}
        )
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            result['response_ms'] = round((time.time() - start) * 1000)
            result['status_code'] = resp.status
            result['is_up'] = 200 <= resp.status < 400
            result['server'] = resp.headers.get('Server', '') or ''
            result['content_type'] = resp.headers.get('Content-Type', '') or ''
            result['final_url'] = resp.geturl()
    except urllib.error.HTTPError as e:
        result['response_ms'] = round((time.time() - start) * 1000)
        result['status_code'] = e.code
        result['is_up'] = False
        result['error'] = f'HTTP {e.code}'
        try:
            result['server'] = e.headers.get('Server', '') or ''
        except Exception:
            pass
    except Exception as e:
        result['response_ms'] = round((time.time() - start) * 1000)
        result['error'] = str(e)[:280]

    # SSL certificate expiry (verified handshake) for https.
    if parsed.scheme == 'https' and parsed.hostname:
        try:
            vctx = ssl.create_default_context()
            with socket.create_connection((parsed.hostname, parsed.port or 443), timeout=5) as sock:
                with vctx.wrap_socket(sock, server_hostname=parsed.hostname) as ssock:
                    cert = ssock.getpeercert()
            not_after = cert.get('notAfter')
            if not_after:
                exp = datetime.datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                result['ssl_days_left'] = (exp - datetime.datetime.utcnow()).days
        except Exception:
            pass

    return result
