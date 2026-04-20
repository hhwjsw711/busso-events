import { SignInForm } from "../SignInForm";
import { routes } from "../router";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import {
  Container,
  Group,
  Button,
  Stack,
  Title,
  Text,
  Center,
  Card,
  Menu,
} from "@mantine/core";

export function LoginPage() {
  const { t } = useTranslation();
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container size="xl" py="md">
        <Group justify="flex-end">
          <Menu shadow="md" width={120}>
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
        </Group>
      </Container>
      <Container
        size="xl"
        style={{
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Center style={{ width: "100%" }}>
          <Card
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            style={{ width: "100%", maxWidth: "400px" }}
          >
            <Stack align="center" gap="md">
              <div style={{ textAlign: "center" }}>
                <Title order={2} mb="xs">
                  {t("login.title")}
                </Title>
                <Text c="dimmed">{t("login.subtitle")}</Text>
              </div>
              <SignInForm />
              <Button variant="subtle" size="sm" {...routes.home().link}>
                {t("login.backToBrowse")}
              </Button>
            </Stack>
          </Card>
        </Center>
      </Container>
    </div>
  );
}
