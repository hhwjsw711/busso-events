import { useTranslation } from "react-i18next";
import { routes } from "../router";
import { Container, Stack, Title, Text, Center, Button } from "@mantine/core";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container size="xl" py="xl">
        <Center style={{ minHeight: "50vh" }}>
          <Stack align="center" gap="md">
            <Title order={3}>{t("common.pageNotFound")}</Title>
            <Text c="dimmed">{t("common.pageNotFoundDescription")}</Text>
            <Button {...routes.home().link}>{t("common.goToHome")}</Button>
          </Stack>
        </Center>
      </Container>
    </div>
  );
}
