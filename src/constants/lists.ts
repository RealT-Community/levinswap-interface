// used to mark unsupported tokens, these are hosted lists of unsupported tokens

const LEVINSWAP_LIST =
  'https://ipfs.io/ipfs/QmVjmLAgkWuNxHAE9Um9KuwEJmTEk82LzdEqLnfiZ5NQpR?filename=levinswap-default.tokenlist.json'
const LEVINSWAP_STABLECOIN_LIST =
  'https://ipfs.io/ipfs/QmWrhnRTCQ8CgSoNmHV6WsneLLhErouD4fQPpSaqhsibpD?filename=levinswap-stablecoin-tokenlist.json'
const REALT_LIST = 'https://api.realt.ch/v1/tokenList'
const REN_LIST =
  'https://ipfs.io/ipfs/QmS55aGgkVoZLj87qP2VZMrnmv5PupMsDVvUp6tBHfReLF?filename=ren-default.tokenlist.json'
const SYNTHETIX_LST =
  'https://ipfs.io/ipfs/QmbZvrV7YsF6eKP8umoauqi7FFTG4KgtQBjTeLfVFJpxZj?filename=synthetix-default.tokenlist.json'
const BSC_LIST =
  'https://ipfs.io/ipfs/QmbFFNszCPSUZktXYdjVd7wSaqnMxeXedrQWC5zcuEk8pv?filename=bsc-default.tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [
  LEVINSWAP_LIST,
  LEVINSWAP_STABLECOIN_LIST,
  REALT_LIST,
  REN_LIST,
  SYNTHETIX_LST,
  BSC_LIST
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = []
