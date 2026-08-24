# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 2.x | Yes |
| 1.x | No. 1.0.4 and earlier cannot be installed from a clean environment; upgrade to 2.x. |

## Reporting a vulnerability

Report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/trsdn/MistralDocAI-mcp/security/advisories/new).
Do not open a public issue, and do not include a working API key in the report.

You can expect an acknowledgement within seven days and an assessment within
thirty. If a fix is warranted, it ships in a release with the advisory
published alongside it.

## What is in scope

- Code in this repository, including the Node.js wrapper and the Python server.
- The published npm package `@trsdn/mistraldocai-mcp-server`.
- The release and CI workflows in `.github/workflows/`.

## What is not in scope

- Vulnerabilities in Mistral AI's service. Report those to
  [Mistral AI](https://mistral.ai/).
- Vulnerabilities in upstream dependencies, unless this project's use of them
  makes an otherwise unexploitable issue exploitable. Report those upstream.
- The consequences of a user configuring a key with more privilege than the
  server needs.

## Handling your API key

The server reads `MISTRAL_API_KEY` from the environment or from
`~/.mistraldocai-mcp/.env`. That file is outside the repository and outside the
installed package, and it is created with your user's default permissions.

The key is sent only to Mistral AI's API. It is never logged: error paths report
the failure without the credential. If you believe a key has been exposed,
revoke it in the [Mistral console](https://console.mistral.ai/) before
reporting.

Note that documents you process are transmitted to Mistral AI. See
[Data and privacy](README.md#data-and-privacy) before processing anything
confidential.
