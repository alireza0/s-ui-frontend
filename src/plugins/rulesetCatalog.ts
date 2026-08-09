export interface CatalogRuleset {
  tag: string
  type: 'remote'
  format: 'binary'
  url: string
  download_detour: string
}

const srs = (kind: 'geosite' | 'geoip', name: string): string =>
  `https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/${kind}/${name}.srs`

const entry = (tag: string, url: string): CatalogRuleset => ({
  tag,
  type: 'remote',
  format: 'binary',
  url,
  download_detour: 'direct',
})

export const geoCatalog: CatalogRuleset[] = [
  entry('geosite-ads', srs('geosite', 'category-ads-all')),
  entry('geosite-private', srs('geosite', 'private')),
  entry('geosite-ir', srs('geosite', 'category-ir')),
  entry('geosite-cn', srs('geosite', 'cn')),
  entry('geosite-vn', 'https://github.com/Thaomtam/Geosite-vn/raw/rule-set/Geosite-vn.srs'),
  entry('geoip-private', srs('geoip', 'private')),
  entry('geoip-ir', srs('geoip', 'ir')),
  entry('geoip-cn', srs('geoip', 'cn')),
  entry('geoip-vn', srs('geoip', 'vn')),
  entry('geosite-google', srs('geosite', 'google')),
  entry('geoip-google', srs('geoip', 'google')),
  entry('geosite-google-play', srs('geosite', 'google-play')),
  entry('geosite-youtube', srs('geosite', 'youtube')),
  entry('geosite-twitter', srs('geosite', 'twitter')),
  entry('geoip-twitter', srs('geoip', 'twitter')),
  entry('geosite-telegram', srs('geosite', 'telegram')),
  entry('geoip-telegram', srs('geoip', 'telegram')),
  entry('geosite-netflix', srs('geosite', 'netflix')),
  entry('geoip-netflix', srs('geoip', 'netflix')),
  entry('geosite-openai', srs('geosite', 'openai')),
  entry('geosite-reddit', srs('geosite', 'reddit')),
]

// geosite-only choices (used for DNS routing selectors)
export const geositeList = [
  { title: 'Private', value: 'geosite-private' },
  { title: 'Ads', value: 'geosite-ads' },
  { title: '🇮🇷 Iran', value: 'geosite-ir' },
  { title: '🇨🇳 China', value: 'geosite-cn' },
  { title: '🇻🇳 Vietnam', value: 'geosite-vn' },
  { title: 'Google', value: 'geosite-google' },
  { title: 'Google Play', value: 'geosite-google-play' },
  { title: 'YouTube', value: 'geosite-youtube' },
  { title: 'Twitter/X', value: 'geosite-twitter' },
  { title: 'Telegram', value: 'geosite-telegram' },
  { title: 'Netflix', value: 'geosite-netflix' },
  { title: 'OpenAI', value: 'geosite-openai' },
  { title: 'Reddit', value: 'geosite-reddit' },
]

// site + ip choices (used for route selectors and ruleset presets)
export const geoList = [
  { title: 'Site-Private', value: 'geosite-private' },
  { title: 'IP-Private', value: 'geoip-private' },
  { title: 'Site-Ads', value: 'geosite-ads' },
  { title: '🇮🇷 Site-Iran', value: 'geosite-ir' },
  { title: '🇮🇷 IP-Iran', value: 'geoip-ir' },
  { title: '🇨🇳 Site-China', value: 'geosite-cn' },
  { title: '🇨🇳 IP-China', value: 'geoip-cn' },
  { title: '🇻🇳 Site-Vietnam', value: 'geosite-vn' },
  { title: '🇻🇳 IP-Vietnam', value: 'geoip-vn' },
  { title: 'Site-Google', value: 'geosite-google' },
  { title: 'IP-Google', value: 'geoip-google' },
  { title: 'Site-GooglePlay', value: 'geosite-google-play' },
  { title: 'Site-YouTube', value: 'geosite-youtube' },
  { title: 'Site-Twitter/X', value: 'geosite-twitter' },
  { title: 'IP-Twitter/X', value: 'geoip-twitter' },
  { title: 'Site-Telegram', value: 'geosite-telegram' },
  { title: 'IP-Telegram', value: 'geoip-telegram' },
  { title: 'Site-Netflix', value: 'geosite-netflix' },
  { title: 'IP-Netflix', value: 'geoip-netflix' },
  { title: 'Site-OpenAI', value: 'geosite-openai' },
  { title: 'Site-Reddit', value: 'geosite-reddit' },
]
