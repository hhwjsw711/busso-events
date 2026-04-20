import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { routes } from "../router";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import {
  Group,
  Text,
  Badge,
  Button,
  Container,
  Paper,
  Avatar,
  Menu,
  rem,
  Image,
} from "@mantine/core";
import { IconUser, IconLogout, IconChevronDown } from "@tabler/icons-react";

interface HeaderProps {
  currentRoute: string | false;
}

export function Header({ currentRoute }: HeaderProps) {
  const { t } = useTranslation();
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.users.isCurrentUserAdmin);
  const { signOut } = useAuthActions();

  // Generate initials from user name or email
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Paper
      shadow="xs"
      withBorder
      style={{
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        position: "sticky",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backgroundColor: "white",
      }}
    >
      <Container size="xl" py="md">
        <Group justify="space-between">
          <Group gap="xl">
            <Button
              variant="subtle"
              size="lg"
              {...routes.home().link}
              color={currentRoute === "home" ? "blue" : "gray"}
              style={{ fontWeight: "bold", fontSize: "1.25rem" }}
              leftSection={
                <Image
                  src="/logo-128.png"
                  alt="Busso Events Logo"
                  w={24}
                  h={24}
                />
              }
            >
              {t("common.bussoEvents")}
            </Button>

            <Group gap="lg">
              <Button
                variant="subtle"
                {...routes.home().link}
                color={currentRoute === "home" ? "blue" : "gray"}
                style={{
                  borderBottom:
                    currentRoute === "home"
                      ? "2px solid var(--mantine-color-blue-6)"
                      : "none",
                }}
              >
                {t("common.events")}
              </Button>

              <Button
                variant="subtle"
                {...routes.subscriptions().link}
                color={
                  currentRoute === "subscriptions" ||
                  currentRoute === "createSubscription"
                    ? "blue"
                    : "gray"
                }
                style={{
                  borderBottom:
                    currentRoute === "subscriptions" ||
                    currentRoute === "createSubscription"
                      ? "2px solid var(--mantine-color-blue-6)"
                      : "none",
                }}
              >
                {t("common.subscriptions")}
              </Button>

              {isAdmin && (
                <Button
                  variant="subtle"
                  {...routes.admin().link}
                  color={
                    ["admin", "eventDebug", "sources", "addSource"].includes(
                      currentRoute as string,
                    )
                      ? "blue"
                      : "gray"
                  }
                  style={{
                    borderBottom: [
                      "admin",
                      "eventDebug",
                      "sources",
                      "addSource",
                    ].includes(currentRoute as string)
                      ? "2px solid var(--mantine-color-blue-6)"
                      : "none",
                  }}
                >
                  {t("common.admin")}
                </Button>
              )}
            </Group>
          </Group>

          <Group gap="sm">
            <Menu shadow="md" width={120} position="bottom-end" zIndex={1100}>
              <Menu.Target>
                <Button variant="subtle" size="sm">
                  🌐 {i18n.language === "en" ? "EN" : "中文"}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={() => i18n.changeLanguage("en")}
                  fw={i18n.language === "en" ? 600 : 400}
                >
                  English
                </Menu.Item>
                <Menu.Item
                  onClick={() => i18n.changeLanguage("zh")}
                  fw={i18n.language === "zh" ? 600 : 400}
                >
                  中文
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            {user && (
              <Menu shadow="md" width={250} position="bottom-end" zIndex={1100}>
                <Menu.Target>
                  <Group
                    gap="xs"
                    style={{
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--mantine-color-gray-0)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Avatar size="md" radius="xl" color="blue">
                      {getUserInitials()}
                    </Avatar>
                    <IconChevronDown
                      size={16}
                      color="var(--mantine-color-gray-6)"
                    />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={
                      <IconUser style={{ width: rem(14), height: rem(14) }} />
                    }
                    disabled
                  >
                    <div>
                      <Text size="sm" fw={500}>
                        {user.name || t("common.user")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                      {isAdmin && (
                        <Badge color="blue" size="xs" mt="2px">
                          {t("common.adminBadge")}
                        </Badge>
                      )}
                    </div>
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item
                    leftSection={
                      <IconLogout style={{ width: rem(14), height: rem(14) }} />
                    }
                    onClick={() => void signOut()}
                    color="red"
                  >
                    {t("common.signOut")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </Container>
    </Paper>
  );
}
