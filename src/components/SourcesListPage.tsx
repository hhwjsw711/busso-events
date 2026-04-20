import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { formatDate } from "../utils/dateUtils";
import { useTranslation } from "react-i18next";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
  Box,
} from "@mantine/core";
import { IconArrowLeft, IconSearch } from "@tabler/icons-react";

interface SourcesListPageProps {
  onBack: () => void;
  onNavigateToAddSource: () => void;
  onNavigateToSourceDetail: (sourceId: Id<"eventSources">) => void;
}

export function SourcesListPage({
  onBack,
  onNavigateToAddSource,
  onNavigateToSourceDetail,
}: SourcesListPageProps) {
  const { t } = useTranslation();
  const sources = useQuery(api.eventSources.eventSourcesAdmin.list);

  if (sources === undefined) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={onBack}
          style={{ alignSelf: "flex-start" }}
        >
          {t("admin.sources.backToAdmin")}
        </Button>

        <Group justify="space-between">
          <Box>
            <Title order={1} size="2.5rem">
              {t("admin.sources.title")}
            </Title>
            <Text c="dimmed" mt="xs">
              {t("admin.sources.description")}
            </Text>
          </Box>
          <Button onClick={onNavigateToAddSource} size="lg">
            {t("admin.sources.addSource")}
          </Button>
        </Group>

        {sources.length === 0 ? (
          <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            style={{ textAlign: "center" }}
          >
            <Text size="4rem" style={{ marginBottom: "1rem" }}>
              🌐
            </Text>
            <Title order={3} mb="xs">
              {t("admin.sources.noSourcesConfigured")}
            </Title>
            <Text c="dimmed" mb="lg">
              {t("admin.sources.noSourcesDescription")}
            </Text>
            <Button onClick={onNavigateToAddSource} size="lg">
              {t("admin.sources.addFirstSource")}
            </Button>
          </Card>
        ) : (
          <Stack gap="lg">
            {sources.map((source: Doc<"eventSources">) => (
              <Card
                key={source._id}
                shadow="sm"
                padding="xl"
                radius="lg"
                withBorder
                style={{ cursor: "pointer" }}
                onClick={() => onNavigateToSourceDetail(source._id)}
              >
                <Group align="flex-start" justify="space-between">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb="sm">
                      <Box
                        w={12}
                        h={12}
                        bg={source.isActive ? "green.5" : "gray.4"}
                        style={{ borderRadius: "50%" }}
                      />
                      <Badge
                        color={source.isActive ? "green" : "gray"}
                        size="sm"
                      >
                        {source.isActive
                          ? t("common.active")
                          : t("admin.sources.inactive")}
                      </Badge>
                    </Group>

                    <Stack gap="sm">
                      <Title order={3} size="lg">
                        {source.name}
                      </Title>
                      <Text
                        size="sm"
                        c="dimmed"
                        style={{ wordBreak: "break-all" }}
                      >
                        {source.startingUrl}
                      </Text>
                      <Group gap="xs">
                        <Text fw={500} size="sm">
                          {t("admin.sources.lastScraped")}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatDate(source.dateLastScrape)}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Text fw={500} size="sm">
                          {t("admin.sources.nextScrape")}
                        </Text>
                        <Text
                          size="sm"
                          c={
                            source.nextScrapeScheduledAt &&
                            source.nextScrapeScheduledAt <= Date.now()
                              ? "green.6"
                              : "dimmed"
                          }
                          fw={
                            source.nextScrapeScheduledAt &&
                            source.nextScrapeScheduledAt <= Date.now()
                              ? 500
                              : undefined
                          }
                        >
                          {source.nextScrapeScheduledAt
                            ? formatDate(source.nextScrapeScheduledAt)
                            : source.isActive
                              ? t("admin.sources.notScheduled")
                              : t("admin.sources.inactive")}
                        </Text>
                      </Group>
                    </Stack>
                  </Box>

                  <Box style={{ minWidth: "120px" }}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToSourceDetail(source._id);
                      }}
                      variant="light"
                      color="violet"
                      size="sm"
                      leftSection={<IconSearch size={16} />}
                    >
                      {t("admin.sources.viewDetails")}
                    </Button>
                  </Box>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
