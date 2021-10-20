export const hls = `
#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=793695,RESOLUTION=640x360,FRAME-RATE=25.000,CODECS="avc1.4d4020,mp4a.40.2",VIDEO-RANGE=SDR
index-f1-v1-a1.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1483884,RESOLUTION=960x540,FRAME-RATE=25.000,CODECS="avc1.4d4020,mp4a.40.2",VIDEO-RANGE=SDR
index-f2-v1-a1.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=3108204,RESOLUTION=1280x720,FRAME-RATE=25.000,CODECS="avc1.640029,mp4a.40.2",VIDEO-RANGE=SDR
index-f3-v1-a1.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=3662134,RESOLUTION=1920x1080,FRAME-RATE=25.000,CODECS="avc1.640032,mp4a.40.2",VIDEO-RANGE=SDR
index-f4-v1-a1.m3u8

#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=115126,RESOLUTION=640x360,CODECS="avc1.4d4020",URI="iframes-f1-v1-a1.m3u8",VIDEO-RANGE=SDR
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=229470,RESOLUTION=960x540,CODECS="avc1.4d4020",URI="iframes-f2-v1-a1.m3u8",VIDEO-RANGE=SDR
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=381495,RESOLUTION=1280x720,CODECS="avc1.640029",URI="iframes-f3-v1-a1.m3u8",VIDEO-RANGE=SDR
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=472439,RESOLUTION=1920x1080,CODECS="avc1.640032",URI="iframes-f4-v1-a1.m3u8",VIDEO-RANGE=SDR
`;

export const dash = `<?xml version="1.0"?>
<MPD
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="urn:mpeg:dash:schema:mpd:2011"
    xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
    type="static"
    mediaPresentationDuration="PT1551.083S"
    minBufferTime="PT10S"
    profiles="urn:mpeg:dash:profile:isoff-main:2011">
  <Period>
    <AdaptationSet
        id="1"
        segmentAlignment="true"
        maxWidth="1920"
        maxHeight="1080"
        maxFrameRate="25">
        <SegmentTemplate
            timescale="1000"
            media="fragment-$Number$-$RepresentationID$.m4s"
            initialization="init-$RepresentationID$.mp4"
            startNumber="1">
            <SegmentTimeline>
                <S d="10000" r="154"/>
                <S d="1080"/>
            </SegmentTimeline>
        </SegmentTemplate>
      <Representation
          id="f1-v1-x3"
          mimeType="video/mp4"
          codecs="avc1.4d4020"
          width="640"
          height="360"
          frameRate="25"
          sar="1:1"
          startWithSAP="1"
          bandwidth="697695">
      </Representation>
      <Representation
          id="f2-v1-x3"
          mimeType="video/mp4"
          codecs="avc1.4d4020"
          width="960"
          height="540"
          frameRate="25"
          sar="1:1"
          startWithSAP="1"
          bandwidth="1387884">
      </Representation>
      <Representation
          id="f3-v1-x3"
          mimeType="video/mp4"
          codecs="avc1.640029"
          width="1280"
          height="720"
          frameRate="25"
          sar="1:1"
          startWithSAP="1"
          bandwidth="2980204">
      </Representation>
      <Representation
          id="f4-v1-x3"
          mimeType="video/mp4"
          codecs="avc1.640032"
          width="1920"
          height="1080"
          frameRate="25"
          sar="1:1"
          startWithSAP="1"
          bandwidth="3470134">
      </Representation>
    </AdaptationSet>
    <AdaptationSet
        id="2"
        segmentAlignment="true">
      <AudioChannelConfiguration
          schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
          value="1"/>
        <SegmentTemplate
            timescale="1000"
            media="fragment-$Number$-$RepresentationID$.m4s"
            initialization="init-$RepresentationID$.mp4"
            startNumber="1">
            <SegmentTimeline>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="9984"/>
                <S d="10005" r="2"/>
                <S d="1067"/>
            </SegmentTimeline>
        </SegmentTemplate>
      <Representation
          id="f1-a1-x3"
          mimeType="audio/mp4"
          codecs="mp4a.40.2"
          audioSamplingRate="48000"
          startWithSAP="1"
          bandwidth="96000">
      </Representation>
      <Representation
          id="f3-a1-x3"
          mimeType="audio/mp4"
          codecs="mp4a.40.2"
          audioSamplingRate="48000"
          startWithSAP="1"
          bandwidth="128000">
      </Representation>
      <Representation
          id="f4-a1-x3"
          mimeType="audio/mp4"
          codecs="mp4a.40.2"
          audioSamplingRate="48000"
          startWithSAP="1"
          bandwidth="192000">
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>
`;
