import {
  Center,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
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
  Switch as HopeSwitch,
  Textarea,
} from "@hope-ui/solid"
import { For, Match, Show, Switch } from "solid-js"
import { useT } from "~/hooks"
import { Flag, SettingItem, Type } from "~/types"
import { TiDelete } from "solid-icons/ti"

// 角色数字到字符串的映射
const getRoleString = (value: string): string => {
  switch (value) {
    case "0":
      return "general"
    case "1":
      return "guest"
    case "2":
      return "admin"
    default:
      return value
  }
}

export type ItemProps = SettingItem & {
  onChange?: (value: string) => void
  onDelete?: () => void
  // value: () => string;
  hideLabel?: boolean
  w?: string
}

const Item = (props: ItemProps) => {
  const t = useT()
  return (
    <FormControl w={props.w ?? "100%"} display="flex" flexDirection="column">
      <Show when={!props.hideLabel}>
        <FormLabel for={props.key} display="flex" alignItems="center">
          {t(`settings.${props.key}`)}
          <Show when={props.flag === Flag.DEPRECATED}>
            <Icon
              ml="$2"
              as={TiDelete}
              boxSize="$5"
              color="$danger9"
              verticalAlign="middle"
              cursor="pointer"
              onClick={() => {
                props.onDelete?.()
              }}
            />
          </Show>
        </FormLabel>
      </Show>
      <Switch fallback={<Center>{t("settings_other.unknown_type")}</Center>}>
        <Match when={[Type.String, Type.Number].includes(props.type)}>
          <Input
            type={props.type === Type.Number ? "number" : ""}
            id={props.key}
            // value={props.value()}
            value={props.value}
            onChange={(e) => props.onChange?.(e.currentTarget.value)}
            readOnly={props.flag === Flag.READONLY}
          />
        </Match>
        <Match when={props.type === Type.Bool}>
          <HopeSwitch
            id={props.key}
            defaultChecked={props.value === "true"}
            // checked={props.value() === "true"}
            onChange={(e: any) =>
              // props.onChange?.(props.value() === "true" ? "false" : "true")
              props.onChange?.(e.currentTarget.checked ? "true" : "false")
            }
            readOnly={props.flag === Flag.READONLY}
          />
        </Match>
        <Match when={props.type === Type.Text}>
          <Textarea
            id={props.key}
            value={props.value}
            // value={props.value()}
            onChange={(e) => props.onChange?.(e.currentTarget.value)}
            readOnly={props.flag === Flag.READONLY}
          />
        </Match>
        <Match when={props.type === Type.Select}>
          <Select
            id={props.key}
            value={
              props.key === "default_role"
                ? getRoleString(props.value)
                : props.value
            }
            onChange={(e) =>
              props.onChange?.(
                props.key === "default_role" ? getRoleString(e) : e,
              )
            }
            readOnly={props.flag === Flag.READONLY}
          >
            <SelectTrigger>
              <SelectPlaceholder>{t("global.choose")}</SelectPlaceholder>
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectListbox>
                <For each={props.options?.split(",")}>
                  {(item) => (
                    <SelectOption value={item}>
                      <SelectOptionText>
                        {/* {t(`settings.${props.key}s.${item}`)} */}
                        {props.key === "default_role"
                          ? t(`${item}`)
                          : t(`settings.${props.key}s.${item}`)}
                      </SelectOptionText>
                      <SelectOptionIndicator />
                    </SelectOption>
                  )}
                </For>
              </SelectListbox>
            </SelectContent>
          </Select>
        </Match>
      </Switch>
      <FormHelperText>
        {props.help ? t(`settings.${props.key}-tips`) : ""}
      </FormHelperText>
    </FormControl>
  )
}

export { Item }
