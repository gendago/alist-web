import {
  Flex,
  VStack,
  Image,
  Anchor,
  Tooltip,
  HStack,
  Switch,
} from "@hope-ui/solid"
import { For, JSXElement } from "solid-js"
import { useRouter, useLink, useT, getLinkByDirAndObj } from "~/hooks"
import { objStore } from "~/store"
import { ObjType } from "~/types"
import { convertURL, joinBase } from "~/utils"
import Artplayer from "artplayer"
import { SelectWrapper } from "~/components"

Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

export const players: { icon: string; name: string; scheme: string }[] = [
  { icon: "iina", name: "IINA", scheme: "iina://weblink?url=$edurl" },
  { icon: "potplayer", name: "PotPlayer", scheme: "potplayer://$durl" },
  { icon: "vlc", name: "VLC", scheme: "vlc://$durl" },
  { icon: "nplayer", name: "nPlayer", scheme: "nplayer-$durl" },
  {
    icon: "omniplayer",
    name: "OmniPlayer",
    scheme: "omniplayer://weblink?url=$durl",
  },
  {
    icon: "figplayer",
    name: "Fig Player",
    scheme: "figplayer://weblink?url=$durl",
  },
  {
    icon: "infuse",
    name: "Infuse",
    scheme: "infuse://x-callback-url/play?url=$durl&sub=$sub",
  },
  {
    icon: "mxplayer",
    name: "MX Player",
    scheme:
      "intent:$durl#Intent;package=com.mxtech.videoplayer.ad;S.title=$name;end",
  },
  {
    icon: "mxplayer-pro",
    name: "MX Player Pro",
    scheme:
      "intent:$durl#Intent;package=com.mxtech.videoplayer.pro;S.title=$name;end",
  },
  {
    icon: "iPlay",
    name: "iPlay",
    scheme: "iplay://play/any?type=url&url=$bdurl",
  },
  { icon: "mpv", name: "mpv", scheme: "mpv://$edurl" },
  {
    icon: "fileball",
    name: "Fileball",
    scheme: "filebox://play?url=$edurl",
  },
  {
    icon: "vidhub",
    name: "VidHub",
    scheme: "open-vidhub://x-callback-url/open?url=$edurl&sub=$sub",
  },
  {
    icon: "yybx",
    name: "yybx",
    scheme: "yybx://play?$durl",
  },
  {
    icon: "senPlayer",
    name: "SenPlayer",
    scheme: "SenPlayer://x-callback-url/play?url=$edurl",
  },
]

export const AutoHeightPlugin = (player: Artplayer) => {
  const { $container, $video } = player.template
  const $videoBox = $container.parentElement!

  player.on("ready", () => {
    const offsetBottom = "1.75rem" // position bottom of "More" button + padding
    $videoBox.style.maxHeight = `calc(100vh - ${$videoBox.offsetTop}px - ${offsetBottom})`
    $videoBox.style.minHeight = "320px" // min width of mobie phone
    player.autoHeight()
  })
  player.on("resize", () => {
    player.autoHeight()
  })
  player.on("error", () => {
    if ($video.style.height) return
    $container.style.height = "60vh"
    $video.style.height = "100%"
  })
}

export const VideoBox = (props: {
  children: JSXElement
  onAutoNextChange: (v: boolean) => void
}) => {
  const { replace } = useRouter()
  const { currentObjLink, getLinkByObj } = useLink()
  let videos = objStore.objs.filter((obj) => obj.type === ObjType.VIDEO)
  if (videos.length === 0) {
    videos = [objStore.obj]
  }
  const t = useT()
  let autoNext = localStorage.getItem("video_auto_next")
  if (!autoNext) {
    autoNext = "true"
  }
  props.onAutoNextChange(autoNext === "true")
  return (
    <VStack w="$full" spacing="$2">
      {props.children}
      <HStack spacing="$2" w="$full">
        <SelectWrapper
          onChange={(name: string) => {
            replace(name)
          }}
          value={objStore.obj.name}
          options={videos.map((obj) => ({ value: obj.name }))}
        />
        <Switch
          css={{
            whiteSpace: "nowrap",
          }}
          defaultChecked={autoNext === "true"}
          onChange={(e) => {
            props.onAutoNextChange(e.currentTarget.checked)
            localStorage.setItem(
              "video_auto_next",
              e.currentTarget.checked.toString(),
            )
          }}
        >
          {t("home.preview.auto_next")}
        </Switch>
      </HStack>
      <Flex wrap="wrap" gap="$1" justifyContent="center">
        <For each={players}>
          {(item) => {
            let scheme = item.scheme
            if (scheme.includes("sub=$sub")) {
              const subFileSuffix = [
                ".srt",
                ".webvtt",
                ".dfxp",
                ".scc",
                ".itt",
                ".stl",
                ".ass",
                ".ssa",
                ".vtt",
                ".sub",
              ]
              const subObjs = objStore.objs.filter((obj) =>
                subFileSuffix.some((suffix) => obj.name.endsWith(suffix)),
              )
              const getFileName = (name: string) =>
                name.substring(0, name.lastIndexOf("."))
              let targetSubObj = subObjs.find(
                (obj) =>
                  getFileName(obj.name) === getFileName(objStore.obj.name),
              )
              if (!targetSubObj && subObjs.length === 1) {
                targetSubObj = subObjs[0]
              }
              if (targetSubObj) {
                scheme = scheme.replace(
                  "sub=$sub",
                  `sub=${encodeURIComponent(
                    getLinkByObj(targetSubObj, "direct", true),
                  )}`,
                )
              }
            }
            return (
              <Tooltip placement="top" withArrow label={item.name}>
                <Anchor
                  // external
                  href={convertURL(scheme, {
                    raw_url: objStore.raw_url,
                    name: objStore.obj.name,
                    d_url: currentObjLink(true),
                  })}
                >
                  <Image
                    m="0 auto"
                    boxSize="$8"
                    src={joinBase(`/images/${item.icon}.webp`)}
                    fallbackSrc={joinBase(`/images/${item.icon}.png`)}
                  />
                </Anchor>
              </Tooltip>
            )
          }}
        </For>
      </Flex>
    </VStack>
  )
}
