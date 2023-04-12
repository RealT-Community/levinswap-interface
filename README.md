# Levinswap Interface

[![Lint](https://github.com/Levinswap/Levinswap-interface/workflows/Lint/badge.svg)](https://github.com/Levinswap/Levinswap-interface/actions?query=workflow%3ALint)
[![Tests](https://github.com/Levinswap/Levinswap-interface/workflows/Tests/badge.svg)](https://github.com/Levinswap/Levinswap-interface/actions?query=workflow%3ATests)
[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

An open source interface for Levinswap -- a protocol for decentralized exchange of xdai and ethereum bridged tokens.

- Website: [levinswap.realt.community](https://levinswap.realt.community/)
- Interface: [app.levinswap.realt.community](https://app.levinswap.realt.community)
- Docs: [levinswap.realt.community/docs/](https://wiki.levinswap.realt.community/levinswap-wiki/)
- Twitter: [@Levinswap](https://twitter.com/Levinswap)
- Email: [contact@levinswap.realt.community](mailto:contact@levinswap.realt.community)

## Accessing the Levinswap Interface

To access the Levinswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Levinswap/Levinswap-interface/releases/latest),
or visit [app.levinswap.realt.community](https://app.levinswap.realt.community).

## Listing a token

Please see the
[@levinswap/default-token-list](https://github.com/levinswap/default-token-list)
repository.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Configuring the environment (optional)

To have the interface default to a different network when a wallet is not connected:

1. Make a copy of `.env` named `.env.local`
2. Change `REACT_APP_NETWORK_ID` to `"{YOUR_NETWORK_ID}"`
3. Change `REACT_APP_NETWORK_URL` to e.g. `"https://{YOUR_NETWORK_ID}.infura.io/v3/{YOUR_INFURA_KEY}"`

Note that the interface only works on testnets where both
[Levinswap V2](https://levinswap.realt.community/docs/v2/smart-contracts/factory/) and
[multicall](https://github.com/makerdao/multicall) are deployed.
The interface will not work on other networks.

## Contributions

**Please open all pull requests against the `master` branch.**
CI checks will run against all PRs.