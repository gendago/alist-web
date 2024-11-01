import { Box, HStack, Image, Text, VStack } from "@hope-ui/solid"
import { onMount } from "solid-js"
import { useRouter, useLink } from "~/hooks"
import { local, objStore } from "~/store"
import { ObjType } from "~/types"
import { convertURL } from "~/utils"
import { players } from "./video_box"
import { SelectWrapper } from "~/components"

const Preview = () => {
  const { replace } = useRouter()
  const { currentObjLink } = useLink()
  const { video_player } = local
  let videos = objStore.objs.filter((obj) => obj.type === ObjType.VIDEO)
  if (videos.length === 0) {
    videos = [objStore.obj]
  }

  const playerItem = players.find((player) => player.icon === video_player)

  const goCustomPlayer = () => {
    if (playerItem) {
      location.href = convertURL(playerItem.scheme, {
        raw_url: objStore.raw_url,
        name: objStore.obj.name,
        d_url: currentObjLink(true),
      })
    }
  }

  onMount(() => {
    goCustomPlayer()
  })
  return (
    <VStack w="$full" spacing="$2">
      <HStack spacing="$2" w="$full">
        <SelectWrapper
          onChange={(name: string) => {
            replace(name)
          }}
          value={objStore.obj.name}
          options={videos.map((obj) => ({ value: obj.name }))}
        />
      </HStack>
      <Box w="$full" mt="$4" onClick={goCustomPlayer}>
        <Image
          m="0 auto"
          boxSize="$8"
          src={`${window.__dynamic_base__}/images/${playerItem?.icon}.webp`}
          fallbackSrc={`${window.__dynamic_base__}/images/${playerItem?.icon}.png`}
          w="auto"
          h="16vh"
        />
        <Text textAlign="center" m="$2 0 $4">
          {playerItem?.name}
        </Text>
      </Box>
    </VStack>
  )
}

export default Preview
