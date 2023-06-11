export interface Tweet {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  possibly_sensitive: boolean
  possibly_sensitive_editable: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
  extended_entities?: ExtendedEntities
  self_thread?: SelfThread
}

export interface Entities {
  media: Media[]
  user_mentions: UserMention[]
  urls: Url[]
  hashtags: Hashtag[]
  symbols: any[]
}

export interface Media {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features?: Features
  sizes: Sizes
  original_info: OriginalInfo
}

export type UserMention = {
  id_str: string
  name: string
  screen_name: string
  indices: [number, number]
}

export type Hashtag = {
  text: string
  indices: [number, number]
}

export type Url = {
  display_url: string
  expanded_url: string
  url: string
  indices: [number, number]
}

export interface Features {
  large?: Faces
  medium?: Faces
  small?: Faces
  orig?: Faces
}

export interface Faces {
  faces: Face[]
}

export interface Face {
  x: number
  y: number
  h: number
  w: number
}

export interface Sizes {
  large: Size
  medium: Size
  small: Size
  thumb: Size
}

export interface Size {
  h: number
  w: number
  resize: string
}

export interface OriginalInfo {
  height: number
  width: number
  focus_rects: FocusRect[]
}

export interface FocusRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ExtendedEntities {
  media: ExtendedMedia[]
}

export interface ExtendedMedia extends Media {
  media_key: string
  ext_media_availability: ExtMediaAvailability
  additional_media_info?: AdditionalMediaInfo
  mediaStats?: MediaStats
  video_info?: VideoInfo
}

export interface ExtMediaAvailability {
  status: string
}

export interface AdditionalMediaInfo {
  monetizable: boolean
}

export interface MediaStats {
  viewCount: number
}

export interface VideoInfo {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant[]
}

export interface Variant {
  bitrate?: number
  content_type: string
  url: string
}

export interface SelfThread {
  id_str: string
}
