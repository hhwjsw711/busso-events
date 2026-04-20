import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { EventDetailPage } from "./EventDetailPage";
import { routes } from "../router";
import { Container, Group, Button, Paper, Menu } from "@mantine/core";
import { Id } from "../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

interface EventDetailPublicProps {
  eventId: string;
}

export function EventDetailPublic({ eventId }: EventDetailPublicProps) {
  const { t } = useTranslation();
  const isAdmin = useQuery(api.users.isCurrentUserAdmin);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Paper
        shadow="xs"
        withBorder
        style={{
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        <Container size="xl" py="md">
          <Group justify="space-between">
            <Button
              variant="subtle"
              size="lg"
              {...routes.home().link}
              color="gray"
              style={{ fontWeight: "bold", fontSize: "1.25rem" }}
            >
              {t("common.bussoEvents")}
            </Button>
            <Group gap="sm">
              <Menu shadow="md" width={120} position="bottom-end">
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
              <Button {...routes.login().link} size="md">
                {t("common.signIn")}
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>
      <Container size="xl" py="xl">
        <EventDetailPage
          eventId={eventId}
          onBack={() => routes.home().push()}
          onDebugClick={
            isAdmin
              ? () =>
                  routes.eventDebug({ eventId: eventId as Id<"events"> }).push()
              : undefined
          }
        />
      </Container>
    </div>
  );
}
