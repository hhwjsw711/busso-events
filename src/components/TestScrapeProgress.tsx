import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";
import {
  Paper,
  Stack,
  Group,
  Text,
  Progress,
  Alert,
  Box,
  Title,
  Table,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

interface TestScrapeProgressProps {
  testScrapeId: Id<"testScrapes"> | null;
}

export function TestScrapeProgress({ testScrapeId }: TestScrapeProgressProps) {
  const { t } = useTranslation();
  const testScrape = useQuery(
    api.eventSources.eventSources.getTestScrapeByIdPublic,
    testScrapeId ? { testScrapeId } : "skip",
  );

  if (!testScrape) return null;

  const getStageProgress = () => {
    switch (testScrape.progress?.stage) {
      case "fetching":
        return 33;
      case "extracting":
        return 66;
      case "processing":
        return 90;
      default:
        return 0;
    }
  };

  const getStatusColor = () => {
    switch (testScrape.status) {
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "running":
        return "blue";
      default:
        return "gray";
    }
  };

  return (
    <Paper withBorder p="md" radius="md" mt="md">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>{t("testScrape.progress")}</Text>
          {testScrape.status === "completed" && (
            <IconCheck size={16} color="green" />
          )}
          {testScrape.status === "failed" && <IconX size={16} color="red" />}
        </Group>
        <Progress
          value={getStageProgress()}
          color={getStatusColor()}
          size="sm"
        />
        <Text size="sm" c="dimmed">
          {testScrape.progress?.message || t("testScrape.initializing")}
        </Text>
        {testScrape.result && (
          <Alert
            color={testScrape.result.success ? "green" : "red"}
            title={
              testScrape.result.success
                ? t("testScrape.testSuccessful")
                : t("testScrape.testFailed")
            }
          >
            {testScrape.result.message}
            {testScrape.result.eventsFound !== undefined && (
              <Text size="sm" mt="xs">
                {t("testScrape.foundEvents", {
                  count: testScrape.result.eventsFound,
                })}
              </Text>
            )}
          </Alert>
        )}
        {testScrape.status === "completed" &&
          testScrape.result?.data?.extractedEvents &&
          testScrape.result.data.extractedEvents.length > 0 && (
            <Box mt="md">
              <Title order={4} mb="xs">
                {t("testScrape.extractedEvents")}
              </Title>
              <Table striped withRowBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("testScrape.title")}</Table.Th>
                    <Table.Th>{t("testScrape.url")}</Table.Th>
                    <Table.Th>{t("testScrape.date")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {testScrape.result.data.extractedEvents.map(
                    (event: any, i: number) => (
                      <Table.Tr key={i}>
                        <Table.Td>{event.title}</Table.Td>
                        <Table.Td>
                          {event.url ? (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {event.url}
                            </a>
                          ) : (
                            ""
                          )}
                        </Table.Td>
                        <Table.Td>{event.eventDate || ""}</Table.Td>
                      </Table.Tr>
                    ),
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          )}
      </Stack>
    </Paper>
  );
}
