# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

We take security issues seriously. If you discover a security vulnerability in imguri, please report it privately.

### How to Report

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues by:

1. **Email**: Send details to the repository maintainer through GitHub's private vulnerability reporting
2. **GitHub Security Advisory**: Use the "Security" tab in the GitHub repository to report privately

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)
- Your contact information for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with our assessment
- **Fix Timeline**: Critical issues patched within 14 days, others within 30 days
- **Disclosure**: Coordinated disclosure after fix is released

## Security Best Practices

When using imguri in production:

1. **Input Validation**: Always validate user-provided file paths before passing to imguri
2. **Absolute Paths**: Be aware that absolute paths can access any readable file on the system
3. **Size Limits**: Configure appropriate `sizeLimit` options to prevent resource exhaustion
4. **Timeouts**: Set reasonable `timeout` values for remote URL fetching
5. **Error Handling**: Never expose raw error messages to end users (may leak file system paths)

## Known Security Considerations

### Path Access

imguri allows absolute file paths by design. In production environments:

- Validate all user input before constructing file paths
- Use a whitelist of allowed directories
- Consider running in a sandboxed environment
- Use the built-in path traversal protection (blocks `../`)

### Remote URLs

When fetching remote URLs:

- URLs are fetched with configurable timeouts (default 20 seconds)
- Content-Type validation ensures only images are processed
- Size limits prevent memory exhaustion
- Consider rate limiting if processing user-provided URLs

## Security Updates

Security updates are published through:

- GitHub Security Advisories
- npm package updates
- CHANGELOG.md with [Security] tags

Subscribe to repository releases to receive notifications.
