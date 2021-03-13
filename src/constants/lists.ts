// used to mark unsupported tokens, these are hosted lists of unsupported tokens

const LEVINSWAP_LIST = 'https://ipfs.io/ipfs/QmX8KFXvKrpqJ1ET16JXNPYhqQn73qRRbZRHiRX6Rui9Zn?filename=Tokenlist'
//const REALT_LIST = 'https://api.realt.ch/v1/tokenList'

export const UNSUPPORTED_LIST_URLS: string[] = []

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [LEVINSWAP_LIST]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = []
