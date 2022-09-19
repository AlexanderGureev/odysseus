/**
 * AdConfig
 * @typedef {object} AdConfig
 */

/**
 * SkinData
 * @typedef {object} SkinData
 * @property {string} config_source
 * @property {string} skin_theme_class
 * @property {integer} partner_id
 * @property {object} base
 * @property {object} embedded
 */

/**
 * Puid12Config
 * @typedef {object} Puid12Config
 * @property {integer} site
 * @property {integer} embed
 */

/**
 * Config
 * @typedef {object} Config
 * @property {AdConfig} ad
 * @property {string} post_image
 * @property {string} pre_image
 * @property {integer} project_id
 * @property {Puid12Config} puid12
 * @property {string} ref
 * @property {string} scrobbling
 * @property {SkinData} skin_data
 * @property {integer} skin_id
 * @property {string} stat_url
 * @property {integer} user_id
 * @property {integer} videofile_id
 */

/**
 * AutoSwitch
 * @typedef {object} AutoSwitch
 * @property {string} badge
 * @property {string} caption
 * @property {string} caption_v2
 * @property {integer} countdown
 * @property {number} point
 * @property {string} project_poster
 */

/**
 * ContentRollsConfig
 * @typedef {object} ContentRollsConfig
 * @property {array<AdPoint>} points
 * @property {array<AdUrl>} url
 */

/**
 * AdPoint
 * @typedef {object} AdPoint
 * @property {number} point
 * @property {object} placeholders
 */

/**
 * AdUrl
 * @typedef {object} AdUrl
 * @property {string} item
 * @property {string} type
 */

/**
 * MidrollsConfig
 * @typedef {object} MidrollsConfig
 * @property {integer} freq_points
 * @property {integer} freq_time
 * @property {integer} max_midrolls
 * @property {array<AdPoint>} points
 * @property {integer} skip_adv
 * @property {integer} start_time
 * @property {array<AdUrl>} url
 */

/**
 * TNSHeartbeatConfig
 * @typedef {object} TNSHeartbeatConfig
 * @property {string} link
 * @property {array<object>} params
 */

/**
 * TrackQueryParams
 * @typedef {object} TrackQueryParams
 * @property {integer} p2p
 * @property {number} previewFrom
 * @property {number} previewTo
 * @property {string} sign
 */

/**
 * TrackVod
 * @typedef {object} TrackVod
 * @property {string} link
 * @property {string} playerLink
 * @property {TrackQueryParams} queryParams
 */

/**
 * LinkedTracks
 * @typedef {object} TrackConfig
 * @property {string} canonicalUrl
 * @property {string} caption
 * @property {integer} episode
 * @property {string} playerConfig
 * @property {string} playerUrl
 * @property {integer} projectId
 * @property {integer} season
 * @property {string} thumbnail
 * @property {integer} trackHubId
 * @property {integer} trackId
 * @property {TrackVod} trackVod
 */

/**
 * LinkedTracks
 * @typedef {object} LinkedTracks
 * @property {TrackConfig} previous
 * @property {TrackConfig} next
 */

/**
 * StreamItem
 * @typedef {object} StreamItem
 * @property {string} drm_type
 * @property {integer} id
 * @property {string} ls_url
 * @property {integer} manifest_expires_at
 * @property {string} protocol
 * @property {string} url
 */

/**
 * LinkedTracks
 * @typedef {object} TNSCounter
 * @property {string} video_end
 * @property {string} video_load
 * @property {string} video_start
 */

/**
 * ErrorItem
 * @typedef {object} ErrorItem
 * @property {integer} code
 * @property {string} details
 * @property {string} title
 */

/**
 * PreviewDuration
 * @typedef {object} PreviewDuration
 * @property {number} from
 * @property {number} to
 */

/**
 * PlaylistItem
 * @typedef {object} PlaylistItem
 * @property {string} error
 * @property {array<ErrorItem>} errors
 * @property {integer} adfox_season_id
 * @property {AutoSwitch} auto_switch
 * @property {boolean} confirm_min_age
 * @property {ContentRollsConfig} contentrolls
 * @property {string} dash_url
 * @property {string} drm
 * @property {integer} duration
 * @property {string} episode_name
 * @property {boolean} feature_film
 * @property {TNSHeartbeatConfig} heartbeat_tns_counter_v1_3
 * @property {string} hls_url
 * @property {LinkedTracks} linked_tracks
 * @property {MidrollsConfig} midrolls
 * @property {integer} min_age
 * @property {integer} num_in_project
 * @property {boolean} paid
 * @property {array<string>} previews_hls
 * @property {array<string>} previews_mp4
 * @property {integer} project_id
 * @property {string} project_name
 * @property {string} season_name
 * @property {string} sharing_url
 * @property {string} streaming_origin
 * @property {array<StreamItem>} streams
 * @property {PreviewDuration} preview_duration
 * @property {array<StreamItem>} preview_streams
 * @property {string} sub_types
 * @property {string} thumbnail_url
 * @property {TNSCounter} tns_counter
 * @property {integer} track_id
 * @property {integer} transaction_id
 * @property {integer} views
 */

/**
 * Playlist
 * @typedef {object} Playlist
 * @property {array<PlaylistItem>} items
 */

/**
 * Project
 * @typedef {object} Project
 * @property {string} canonicalUrl
 * @property {string} description
 * @property {boolean} hasRightAvod
 * @property {boolean} hasRightFree
 * @property {boolean} hasRightSvod
 * @property {integer} hubId
 * @property {integer} id
 * @property {string} projectCategory
 * @property {string} title
 */

/**
 * Season
 * @typedef {object} Season
 * @property {string} canonicalUrl
 * @property {string} description
 * @property {integer} hubId
 * @property {integer} id
 * @property {string} title
 */

/**
 * Track
 * @typedef {object} Track
 * @property {string} canonicalUrl
 * @property {string} description
 * @property {boolean} hasRightAvod
 * @property {boolean} hasRightFree
 * @property {boolean} hasRightSvod
 * @property {integer} hubId
 * @property {integer} id
 * @property {integer} morpheusId
 * @property {string} title
 * @property {string} viewType
 */

/**
 * TrackInfo
 * @typedef {object} TrackInfo
 * @property {Project} project
 * @property {Season} season
 * @property {Track} track
 */

/**
 * ServiceTariff
 * @typedef {object} ServiceTariff
 * @property {array<object>} advantages
 * @property {integer} id
 * @property {string} name
 * @property {array<object>} options
 * @property {string} state
 * @property {array<object>} tariffs
 */

/**
 * MediascopeCounter
 * @typedef {object} MediascopeCounter
 * @property {string} link
 * @property {object} params
 */

/**
 * Subscription
 * @typedef {object} Subscription
 * @property {array<string>} appliedTariffModifiers
 * @property {string} beginAt
 * @property {object} card
 * @property {string} endAt
 * @property {integer} id
 * @property {boolean} isAutoRenewing
 * @property {integer} paymentMethodId
 * @property {object} paymentMethodPrice
 * @property {string} paymentMethodType
 * @property {boolean} paymentPending
 * @property {string} productId
 * @property {integer} promocodeActivatedId
 * @property {string} receiptText
 * @property {string} receiptUrl
 * @property {object} servicePackage
 * @property {string} state
 * @property {object} subscriptionModifier
 * @property {object} tariffDuration
 * @property {integer} tariffId
 */

/**
 * SirenConfig
 * @typedef {object} SirenConfig
 * @property {Config} config - config
 * @property {Playlist} playlist - playlist
 */

/**
 * ExperimentsCfg
 * @typedef {object} ExperimentsCfg
 */

/**
 * PlayerConfig
 * @typedef {object} PlayerConfig
 * @property {Config} config
 * @property {Playlist} playlist
 * @property {SkinData} features
 * @property {array<ServiceTariff>} serviceTariffs
 * @property {array<Subscription>} subscriptions
 * @property {TrackInfo} trackInfo
 * @property {ExperimentsCfg} experiments
 */
