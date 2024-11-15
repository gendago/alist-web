import { HStack, Icon, Text } from "@hope-ui/solid"
import { Motion } from "@motionone/solid"
import { useContextMenu } from "solid-contextmenu"
import { batch, Show } from "solid-js"
import { LinkWithPush } from "~/components"
import { getLinkByDirAndObj, usePath, useRouter, useUtil } from "~/hooks"
import {
  checkboxOpen,
  getMainColor,
  local,
  objStore,
  OrderBy,
  selectAll,
  selectIndex,
} from "~/store"
import { ObjType, StoreObj } from "~/types"
import { bus, convertURL, formatDate, getFileSize, hoverColor } from "~/utils"
import { getIconByObj } from "~/utils/icon"
import {
  ItemCheckbox,
  useOpenItemWithCheckbox,
  useSelectWithMouse,
} from "./helper"
import { players } from "~/pages/home/previews/video_box"

export interface Col {
  name: OrderBy
  textAlign: "left" | "right"
  w: any
}

export const cols: Col[] = [
  { name: "name", textAlign: "left", w: { "@initial": "76%", "@md": "50%" } },
  { name: "size", textAlign: "right", w: { "@initial": "24%", "@md": "17%" } },
  { name: "modified", textAlign: "right", w: { "@initial": 0, "@md": "33%" } },
]

export const ListItem = (props: { obj: StoreObj; index: number }) => {
  const { isHide } = useUtil()
  if (isHide(props.obj)) {
    return null
  }
  const { setPathAs } = usePath()
  const { show } = useContextMenu({ id: 1 })
  const { pushHref, to, pathname } = useRouter()
  const { isMouseSupported } = useSelectWithMouse()
  const isShouldOpenItem = useOpenItemWithCheckbox()
  const filenameStyle = () => local["list_item_filename_overflow"]
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        width: "100%",
      }}
    >
      <HStack
        classList={{ selected: !!props.obj.selected }}
        class="list-item viselect-item"
        data-index={props.index}
        w="$full"
        p="$2"
        rounded="$lg"
        transition="all 0.3s"
        _hover={{
          transform: "scale(1.01)",
          bgColor: hoverColor(),
        }}
        as={LinkWithPush}
        href={props.obj.name}
        cursor={
          !isMouseSupported() && (!checkboxOpen() || isShouldOpenItem())
            ? "pointer"
            : "default"
        }
        bgColor={props.obj.selected ? hoverColor() : undefined}
        on:dblclick={(e: MouseEvent) => {
          if (!isMouseSupported()) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) return
          to(pushHref(props.obj.name))
        }}
        on:click={(e: MouseEvent) => {
          if (props.obj.type === ObjType.VIDEO) {
            const { video_player } = local
            if (video_player !== "default") {
              const playerItem = players.find(
                (player) => player.icon === video_player,
              )
              if (playerItem) {
                ;(e.currentTarget as HTMLElement).style.color =
                  "rgb(85, 26, 139)"
                let scheme = playerItem.scheme
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
                    ".sup",
                  ]
                  const subObjs = objStore.objs.filter((obj) =>
                    subFileSuffix.some((suffix) => obj.name.endsWith(suffix)),
                  )
                  const getFileName = (name: string) =>
                    name.substring(0, name.lastIndexOf("."))
                  let targetSubObj = subObjs.find(
                    (obj) =>
                      getFileName(obj.name) === getFileName(props.obj.name),
                  )
                  if (!targetSubObj && subObjs.length === 1) {
                    targetSubObj = subObjs[0]
                  }
                  if (targetSubObj) {
                    scheme = scheme.replace(
                      "sub=$sub",
                      `sub=${encodeURIComponent(
                        getLinkByDirAndObj(
                          pathname(),
                          targetSubObj,
                          "direct",
                          true,
                        ),
                      )}`,
                    )
                  }
                }
                location.href = convertURL(scheme, {
                  raw_url: objStore.raw_url,
                  name: objStore.obj.name,
                  d_url: getLinkByDirAndObj(
                    pathname(),
                    props.obj,
                    "direct",
                    true,
                  ),
                })
                return e.preventDefault()
              }
            }
          }
          if (isMouseSupported()) return e.preventDefault()
          if (!checkboxOpen()) return
          e.preventDefault()
          if (isShouldOpenItem()) {
            to(pushHref(props.obj.name))
            return
          }
          selectIndex(props.index, !props.obj.selected)
        }}
        onMouseEnter={() => {
          setPathAs(props.obj.name, props.obj.is_dir, true)
        }}
        onContextMenu={(e: MouseEvent) => {
          batch(() => {
            // if (!checkboxOpen()) {
            //   toggleCheckbox();
            // }
            selectAll(false)
            selectIndex(props.index, true, true)
          })
          show(e, { props: props.obj })
        }}
      >
        <HStack class="name-box" spacing="$1" w={cols[0].w}>
          <Show when={checkboxOpen()}>
            <ItemCheckbox
              // colorScheme="neutral"
              on:click={(e: MouseEvent) => {
                e.stopPropagation()
              }}
              checked={props.obj.selected}
              onChange={(e: any) => {
                selectIndex(props.index, e.target.checked)
              }}
            />
          </Show>
          <Icon
            class="icon"
            boxSize="$6"
            color={getMainColor()}
            as={getIconByObj(props.obj)}
            mr="$1"
            on:click={(e: MouseEvent) => {
              if (props.obj.type === ObjType.IMAGE) {
                e.stopPropagation()
                e.preventDefault()
                bus.emit("gallery", props.obj.name)
              }
            }}
          />
          <Text
            class="name"
            css={{
              wordBreak: "break-all",
              whiteSpace: filenameStyle() === "multi_line" ? "unset" : "nowrap",
              "overflow-x":
                filenameStyle() === "scrollable" ? "auto" : "hidden",
              textOverflow:
                filenameStyle() === "ellipsis" ? "ellipsis" : "unset",
              "scrollbar-width": "none", // firefox
              "&::-webkit-scrollbar": {
                // webkit
                display: "none",
              },
            }}
            title={props.obj.name}
          >
            {props.obj.name}
          </Text>
        </HStack>
        <Text class="size" w={cols[1].w} textAlign={cols[1].textAlign as any}>
          {getFileSize(props.obj.size)}
        </Text>
        <Text
          class="modified"
          display={{ "@initial": "none", "@md": "inline" }}
          w={cols[2].w}
          textAlign={cols[2].textAlign as any}
        >
          {formatDate(props.obj.modified)}
        </Text>
      </HStack>
    </Motion.div>
  )
}
