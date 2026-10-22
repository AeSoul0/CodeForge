# Security Policy

## Supported versions

Only the current `main` branch, deployed at https://aesoul0.com, is
supported. There are no released versions to backport fixes to.

## Reporting a vulnerability

Please report vulnerabilities privately, not in a public issue or pull
request.

* Email: samuelearabia10@gmail.com, subject starting with `[CodeForge security]`.
* Include the affected URL or file, steps to reproduce, and the impact you
  expect.

You can expect an acknowledgement within 3 working days. A fix, or an
explanation of why the report is not a vulnerability, follows once it has
been reproduced. Credit is given in the fix's pull request unless you prefer
not to be named.

## Scope

In scope: the public site (aesoul0.com), the API it calls and the code in
this repository.

Out of scope: denial-of-service and volume testing, social engineering, and
issues in third-party services (Vercel, Render, MongoDB Atlas, Cloudflare)
that should be reported to those providers.

Please do not access or change data that is not yours, and stop testing once
you have shown the issue.

## How the project is secured

The security architecture, the controls and how they are tested are
documented in [docs/security.md](docs/security.md). Session revocation and
other procedures are in [docs/operations.md](docs/operations.md#5-session-revocation).
