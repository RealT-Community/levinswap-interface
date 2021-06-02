// used to mark unsupported tokens, these are hosted lists of unsupported tokens

const LEVINSWAP_LIST =
  'https://ipfs.io/ipfs/QmUmN7Be3LLHiEwcVZDm6WsPjcTddWsc6C7hrLCmPzsanv?filename=levinswap-default.tokenlist.json'
const LEVINSWAP_STABLECOIN_LIST =
  'https://ipfs.io/ipfs/QmWrhnRTCQ8CgSoNmHV6WsneLLhErouD4fQPpSaqhsibpD?filename=levinswap-stablecoin-tokenlist.json'
const REALT_LIST = 'https://api.realt.community/v1/tokenList'
const REN_LIST =
  'https://ipfs.io/ipfs/QmSqYWWdzfngm57int8AesJr1APRBBYxC8knmYC9rN4ECj?filename=ren-default.tokenlist.json'
const SYNTHETIX_LST =
  'https://ipfs.io/ipfs/QmYeWjmKW4tQ6JfCG9XUkVa9CFBAUY36Z1W9w1iM6Bx4ne?filename=synthetix-default.tokenlist.json'
const BSC_LIST =
  'https://ipfs.io/ipfs/QmcT2RnZ2tJcpfxaruy1EkKAF6aGCRrVsNFfn5oSCQLPQJ?filename=bsc-default.tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [
  LEVINSWAP_LIST,
  LEVINSWAP_STABLECOIN_LIST,
  REALT_LIST,
  REN_LIST,
  SYNTHETIX_LST,
  BSC_LIST,
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = []
