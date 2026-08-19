---
'@spritz-finance/api-client': minor
---

Make `sandbox` the canonical environment value while retaining `staging` as a deprecated input alias, add an integrator-only credential check for the Sandbox quickstart, and document the Developer Access credential boundaries. This is a minor release because the serialized value of `Environment.Sandbox` changes even though existing raw `staging` input remains accepted.
