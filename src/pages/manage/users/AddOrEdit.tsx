import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Select,
  SelectContent,
  SelectIcon,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectPlaceholder,
  SelectTrigger,
  SelectValue,
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
} from "@hope-ui/solid"
import { MaybeLoading, FolderChooseInput } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { getRoleDetail, handleResp, notify, r } from "~/utils"
import { PEmptyResp, PResp, User } from "~/types"
import { createStore } from "solid-js/store"
import { For, Show, createSignal } from "solid-js"
import { me } from "~/store"
import { PublicKeys } from "./PublicKeys"
import { getRoleList } from "~/utils/api"

const AddOrEdit = () => {
  const t = useT()
  const { params, back } = useRouter()
  const { id } = params
  const [roles, setRoles] = createSignal<{ id: number; name: string }[]>([])
  const [paths, setPaths] = createSignal<string[]>([])

  const [user, setUser] = createStore<User>({
    id: 0,
    username: "",
    password: "",
    base_path: "",
    role: [],
    permission: 0,
    disabled: false,
    sso_id: "",
    role_info: [],
    permissions: [],
    max_devices: undefined,
    session_ttl: undefined,
  })

  const [rolesLoading, loadRoles] = useFetch(() => getRoleList())

  const [userLoading, loadUser] = useFetch(
    (): PResp<User> => r.get(`/admin/user/get?id=${id}`),
  )

  const initData = async () => {
    // 加载角色列表
    const rolesResp = await loadRoles()
    handleResp(rolesResp, (data) => {
      setRoles(data.content)
    })

    if (id) {
      const resp = await loadUser()
      handleResp(resp, (data) => {
        setUser(data)
        loadPathsFromRoles(data.role)
      })
    } else {
      setUser("base_path", "/")
    }
  }

  const loadPathsFromRoles = async (roleIds: number[]) => {
    const pathSet = new Set<string>()
    pathSet.add("/")
    for (const roleId of roleIds) {
      const resp = await getRoleDetail(roleId)
      handleResp(resp, (data) => {
        for (const scope of data.permission_scopes || []) {
          if (scope.path) {
            pathSet.add(scope.path)
          }
        }
      })
    }
    setPaths([...pathSet].map((p) => p.toString()))
  }

  initData()

  const [okLoading, ok] = useFetch((): PEmptyResp => {
    return r.post(`/admin/user/${id ? "update" : "create"}`, user)
  })

  const isNew = () => !id

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <Heading>{id ? t("global.edit") : t("global.add")}</Heading>
      <MaybeLoading loading={userLoading() || rolesLoading()}>
        <VStack spacing="$2" alignItems="start" w="$full">
          <Show when={!id || !(user.role_info || []).includes(1)}>
            <FormControl
              w="$full"
              display="flex"
              flexDirection="column"
              required
            >
              <FormLabel for="username" display="flex" alignItems="center">
                {t(`users.username`)}
              </FormLabel>
              <Input
                id="username"
                value={user.username}
                onChange={(e) => setUser("username", e.currentTarget.value)}
              />
            </FormControl>
            <FormControl
              w="$full"
              display="flex"
              flexDirection="column"
              required
            >
              <FormLabel for="password" display="flex" alignItems="center">
                {t(`users.password`)}
              </FormLabel>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={user.password}
                onChange={(e) => setUser("password", e.currentTarget.value)}
              />
            </FormControl>
          </Show>

          <Show when={!isNew()}>
            <FormControl
              w="$full"
              display="flex"
              flexDirection="column"
              required
            >
              <FormLabel for="base_path" display="flex" alignItems="center">
                {t(`users.base_path`)}
              </FormLabel>
              <Select
                value={user.base_path}
                onChange={(value) => setUser("base_path", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectListbox>
                    <For each={paths()}>
                      {(p) => (
                        <SelectOption value={p}>
                          <SelectOptionText>{p}</SelectOptionText>
                          <SelectOptionIndicator />
                        </SelectOption>
                      )}
                    </For>
                  </SelectListbox>
                </SelectContent>
              </Select>
            </FormControl>
          </Show>

          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel display="flex" alignItems="center">
              {t(`users.role`)}
            </FormLabel>
            <Select
              value={user.role}
              onChange={(values) => setUser("role", values)}
            >
              <SelectTrigger>
                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap="$2"
                  pr="$6"
                  py="$2"
                  minH="40px"
                  alignItems="center"
                >
                  <Show
                    when={user.role.length > 0}
                    fallback={
                      <SelectPlaceholder>
                        {t("home.selected")}
                      </SelectPlaceholder>
                    }
                  >
                    <For each={user.role}>
                      {(roleId) => {
                        const role = roles().find((r) => r.id === roleId)
                        return (
                          <Tag
                            size="lg"
                            variant="subtle"
                            bgColor="$neutral2"
                            rounded="$sm"
                            px="$3"
                            py="$1"
                          >
                            <TagLabel>{role?.name || `ID: ${roleId}`}</TagLabel>
                            <TagCloseButton
                              onClick={(e) => {
                                e.stopPropagation()
                                setUser(
                                  "role",
                                  user.role.filter((id) => id !== roleId),
                                )
                              }}
                            />
                          </Tag>
                        )
                      }}
                    </For>
                  </Show>
                </Box>
              </SelectTrigger>
              <SelectContent>
                <SelectListbox>
                  <For each={roles()}>
                    {(role) => (
                      <SelectOption
                        value={role.id}
                        onClick={() => {
                          // 单选逻辑：如果已选中则移除，否则替换为当前选择
                          const newRoles = user.role.includes(role.id)
                            ? user.role.filter((id) => id !== role.id)
                            : [role.id] // 只保留当前选择的角色
                          setUser("role", newRoles)
                        }}
                      >
                        <HStack spacing="$2" w="$full" pl="$4" fontSize="$lg">
                          <Checkbox
                            checked={user.role.includes(role.id)}
                            readOnly
                          />
                          <SelectOptionText>{role.name}</SelectOptionText>
                        </HStack>
                      </SelectOption>
                    )}
                  </For>
                </SelectListbox>
              </SelectContent>
            </Select>
          </FormControl>

          <FormControl w="fit-content" display="flex">
            <Checkbox
              css={{ whiteSpace: "nowrap" }}
              id="disabled"
              onChange={(e: any) =>
                setUser("disabled", e.currentTarget.checked)
              }
              color="$neutral10"
              fontSize="$sm"
              checked={user.disabled}
            >
              {t(`users.disabled`)}
            </Checkbox>
          </FormControl>

          <FormControl w="$full" display="flex" flexDirection="column">
            <FormLabel for="max_devices" display="flex" alignItems="center">
              {t(`users.max_devices`)}
            </FormLabel>
            <Input
              id="max_devices"
              type="number"
              value={user.max_devices ?? ""}
              onInput={(e) =>
                setUser(
                  "max_devices",
                  e.currentTarget.value
                    ? Number(e.currentTarget.value)
                    : undefined,
                )
              }
            />
          </FormControl>

          <FormControl w="$full" display="flex" flexDirection="column">
            <FormLabel for="session_ttl" display="flex" alignItems="center">
              {t(`users.session_ttl`)}
            </FormLabel>
            <Input
              id="session_ttl"
              type="number"
              value={user.session_ttl ?? ""}
              onInput={(e) =>
                setUser(
                  "session_ttl",
                  e.currentTarget.value
                    ? Number(e.currentTarget.value)
                    : undefined,
                )
              }
            />
          </FormControl>

          <Button
            loading={okLoading()}
            onClick={async () => {
              // // 校验密码不能为空
              // if (!user.password.trim()) {
              //   notify.error(t("users.password") + " " + t("global.required"))
              //   return
              // }

              // 校验角色不能为空
              if (!user.role || user.role.length === 0) {
                notify.error(t("users.role") + " " + t("global.required"))
                return
              }

              const resp = await ok()
              handleResp(resp, () => {
                notify.success(t("global.save_success"))
                back()
              })
            }}
          >
            {t("global.save")}
          </Button>
        </VStack>
      </MaybeLoading>
    </VStack>
  )
}

export default AddOrEdit
