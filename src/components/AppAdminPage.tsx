import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useAPIErrorHandler } from "../utils/hooks";
import { formatRelativeTimeBidirectional } from "../utils/dateUtils";
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
  SimpleGrid,
  Box,
  Progress,
  Divider,
  List,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBrain,
  IconSettings,
  IconClock,
  IconDatabase,
  IconMail,
  IconCalendar,
  IconCheck,
  IconX,
  IconLoader,
  IconSearch,
  IconExternalLink,
  IconCpu,
  IconTrash,
  IconBrush,
  IconBell,
  IconBellRinging,
  IconTool,
} from "@tabler/icons-react";

interface AppAdminPageProps {
  onNavigateToSources: () => void;
  onNavigateToSubscriptionDebug: () => void;
  onNavigateToWorkpoolDebug: (
    workpoolType:
      | "eventScrapeWorkpool"
      | "eventEmbeddingWorkpool"
      | "subscriptionMatchWorkpool"
      | "subscriptionEmailWorkpool",
  ) => void;
}

export function AppAdminPage({
  onNavigateToSources,
  onNavigateToSubscriptionDebug,
  onNavigateToWorkpoolDebug,
}: AppAdminPageProps) {
  const { t } = useTranslation();
  const eventsReadyForScraping = useQuery(
    api.events.eventsAdmin.getEventsReadyForScraping,
  );
  const generateMissingEmbeddings = useAction(
    api.embeddings.embeddingsAdmin.generateMissingEmbeddings,
  );
  const deleteAllEvents = useAction(api.events.eventsAdmin.deleteAllEvents);
  const clearAllWorkpools = useAction(api.events.eventsAdmin.clearAllWorkpools);
  const fixMissingSourceSchedules = useAction(
    api.eventSources.eventSourcesAdmin.fixMissingSourceSchedules,
  );
  const queueStats = useQuery(api.emails.emails.getQueueStats);
  const jobsStatus = useQuery(api.jobs.getSystemStatus);
  const schedulingInfo = useQuery(api.events.eventsAdmin.getSchedulingInfo);
  const sourcesStatus = useQuery(
    api.eventSources.eventSourcesAdmin.getSourcesStatus,
  );
  const workpoolsStatus = useQuery(api.events.eventsAdmin.getWorkpoolsStatus);

  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isDeletingAllEvents, setIsDeletingAllEvents] = useState(false);
  const [isClearingAllWorkpools, setIsClearingAllWorkpools] = useState(false);
  const [isFixingSchedules, setIsFixingSchedules] = useState(false);

  const onApiError = useAPIErrorHandler();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "running":
        return "blue";
      case "pending":
        return "yellow";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const handleDeleteAllEvents = () => {
    if (!confirm(t("admin.deleteAllEventsConfirm"))) {
      return;
    }

    const confirmation = prompt(t("admin.deleteAllEventsFinal"));
    if (confirmation !== "DELETE ALL") {
      notifications.show({
        title: t("admin.cancelled"),
        message: t("admin.deletionCancelled"),
        color: "blue",
      });
      return;
    }

    setIsDeletingAllEvents(true);
    deleteAllEvents({})
      .then((result) => {
        notifications.show({
          title: t("admin.success"),
          message: t("admin.successfullyDeleted", {
            count: result.deletedCount,
          }),
          color: "green",
        });
        if (result.failedCount > 0) {
          notifications.show({
            title: t("admin.warning"),
            message: t("admin.failedToDelete", { count: result.failedCount }),
            color: "yellow",
          });
        }
      })
      .catch(onApiError)
      .finally(() => setIsDeletingAllEvents(false));
  };

  const handleClearAllWorkpools = () => {
    if (!confirm(t("admin.clearAllWorkpoolsConfirm"))) {
      return;
    }

    setIsClearingAllWorkpools(true);
    clearAllWorkpools({})
      .then((result) => {
        notifications.show({
          title: t("admin.success"),
          message: t("admin.clearAllWorkpoolsSuccess", {
            count: result.totalCleared,
          }),
          color: "green",
        });
        if (result.totalFailed > 0) {
          notifications.show({
            title: t("admin.warning"),
            message: t("admin.failedToClear", { count: result.totalFailed }),
            color: "yellow",
          });
        }
      })
      .catch(onApiError)
      .finally(() => setIsClearingAllWorkpools(false));
  };

  const handleFixMissingSchedules = () => {
    if (!confirm(t("admin.fixSchedulesConfirm"))) {
      return;
    }

    setIsFixingSchedules(true);
    fixMissingSourceSchedules({})
      .then((result) => {
        notifications.show({
          title: t("admin.success"),
          message: t("admin.fixSchedulesSuccess", {
            checked: result.sourcesChecked,
            fixed: result.sourcesFixed,
          }),
          color: "green",
        });

        if (result.sources.some((s: any) => s.error)) {
          const failedSources = result.sources.filter((s: any) => s.error);
          notifications.show({
            title: t("admin.someSourcesFailed"),
            message: `${failedSources.length} sources failed to schedule: ${failedSources.map((s: any) => s.name).join(", ")}`,
            color: "yellow",
          });
        }
      })
      .catch(onApiError)
      .finally(() => setIsFixingSchedules(false));
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Box>
          <Title order={1} size="2.5rem">
            {t("admin.dashboard")}
          </Title>
          <Text c="dimmed" mt="xs">
            {t("admin.dashboardDescription")}
          </Text>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t("admin.eventsReadyForScraping")}
                </Text>
                <Text size="2xl" fw={700} c="blue.6">
                  {eventsReadyForScraping?.length || 0}
                </Text>
              </Box>
              <ThemeIcon variant="light" size={38} radius="md" color="blue">
                <IconDatabase size={18} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t("admin.emailQueue")}
                </Text>
                <Text size="2xl" fw={700} c="orange.6">
                  {queueStats?.unsent || 0}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("admin.sentTotal", { count: queueStats?.sent || 0 })}
                </Text>
              </Box>
              <ThemeIcon variant="light" size={38} radius="md" color="orange">
                <IconMail size={18} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t("admin.activeJobs")}
                </Text>
                <Text size="2xl" fw={700} c="cyan.6">
                  {jobsStatus?.activeJobs?.length || 0}
                </Text>
              </Box>
              <ThemeIcon variant="light" size={38} radius="md" color="cyan">
                <IconLoader size={18} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t("admin.sourcesNeedingScraping")}
                </Text>
                <Text size="2xl" fw={700} c="red.6">
                  {sourcesStatus?.sourcesNeedingScraping || 0}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("admin.ofActive", {
                    count: sourcesStatus?.activeSources || 0,
                  })}
                </Text>
              </Box>
              <ThemeIcon variant="light" size={38} radius="md" color="red">
                <IconSearch size={18} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {/* System Status */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          {/* Active Jobs */}
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} size="lg" mb="md">
              <Group gap="xs">
                <IconLoader size={20} />
                {t("admin.activeJobs")}
              </Group>
            </Title>

            {jobsStatus?.activeJobs && jobsStatus.activeJobs.length > 0 ? (
              <Stack gap="sm">
                {jobsStatus.activeJobs.map((job: any) => (
                  <Box key={job._id}>
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Text fw={500} size="sm">
                          {job.kind === "batch_event_scrape"
                            ? t("admin.batchEventScraping")
                            : t("admin.batchSourceScraping")}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t("common.back")}{" "}
                          {formatRelativeTimeBidirectional(job.startedAt)}
                        </Text>
                        {job.progress?.currentEvent && (
                          <Text size="xs" c="blue">
                            {t("admin.nextUpcomingMatches", {
                              title: job.progress.currentEvent,
                              time: "",
                            })}
                          </Text>
                        )}
                        {job.progress?.currentSource && (
                          <Text size="xs" c="blue">
                            {t("admin.nextUpcomingMatches", {
                              title: job.progress.currentSource,
                              time: "",
                            })}
                          </Text>
                        )}
                      </Box>
                      <Badge color={getStatusColor(job.status)} size="sm">
                        {job.status}
                      </Badge>
                    </Group>

                    {job.status === "running" && (
                      <Progress
                        value={
                          job.kind === "batch_event_scrape"
                            ? ((job.progress?.processedEvents || 0) /
                                (job.progress?.totalEvents || 1)) *
                              100
                            : ((job.progress?.processedSources || 0) /
                                (job.progress?.totalSources || 1)) *
                              100
                        }
                        size="sm"
                        mt="xs"
                        color={getStatusColor(job.status)}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="md">
                {t("admin.noActiveJobsRunning")}
              </Text>
            )}
          </Card>

          {/* Scheduled Operations */}
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} size="lg" mb="md">
              <Group gap="xs">
                <IconClock size={20} />
                {t("admin.scheduledOperations")}
              </Group>
            </Title>

            <Stack gap="md">
              {/* Subscription Matching */}
              <Box>
                <Group justify="space-between" align="center" mb="xs">
                  <Text fw={500} size="sm">
                    {t("admin.subscriptionMatching")}
                  </Text>
                  <Badge
                    color={
                      schedulingInfo?.upcomingMatching ? "green" : "yellow"
                    }
                    size="sm"
                  >
                    {t("admin.scheduled", {
                      count: schedulingInfo?.upcomingMatching || 0,
                    })}
                  </Badge>
                </Group>
                {schedulingInfo?.overdueMatching &&
                  schedulingInfo.overdueMatching > 0 && (
                    <Text size="xs" c="red" mb="xs">
                      {t("admin.overdueMatches", {
                        count: schedulingInfo.overdueMatching,
                      })}
                    </Text>
                  )}
                {schedulingInfo?.nextMatches &&
                schedulingInfo.nextMatches.length > 0 ? (
                  <Text size="xs" c="dimmed">
                    {t("admin.nextUpcomingMatches", {
                      title: schedulingInfo.nextMatches[0].title,
                      time: formatRelativeTimeBidirectional(
                        schedulingInfo.nextMatches[0].scheduledAt!,
                      ),
                    })}
                  </Text>
                ) : (
                  <Text size="xs" c="dimmed">
                    {t("admin.noUpcomingMatches")}
                  </Text>
                )}
              </Box>

              <Divider />

              {/* Email Sending */}
              <Box>
                <Group justify="space-between" align="center" mb="xs">
                  <Text fw={500} size="sm">
                    {t("admin.emailSending")}
                  </Text>
                  <Badge color="green" size="sm">
                    {workpoolsStatus?.subscriptionEmailWorkpool?.queuedJobs ||
                      0}{" "}
                    {
                      t("admin.scheduled", {
                        count:
                          workpoolsStatus?.subscriptionEmailWorkpool
                            ?.queuedJobs || 0,
                      }).split(" ")[0]
                    }
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {t("admin.runsAutomatically")}
                </Text>
              </Box>

              <Divider />

              {/* Source Scraping */}
              <Box>
                <Group justify="space-between" align="center" mb="xs">
                  <Text fw={500} size="sm">
                    {t("admin.sourceScraping")}
                  </Text>
                  <Badge
                    color={
                      sourcesStatus?.sourcesNeedingScraping ? "red" : "green"
                    }
                    size="sm"
                  >
                    {t("admin.due", {
                      count: sourcesStatus?.sourcesNeedingScraping || 0,
                    })}
                  </Badge>
                </Group>
                {sourcesStatus?.nextScrapingCandidates &&
                  sourcesStatus.nextScrapingCandidates.length > 0 && (
                    <Text size="xs" c="dimmed">
                      {t("admin.nextSource", {
                        name: sourcesStatus.nextScrapingCandidates[0].name,
                        time: sourcesStatus.nextScrapingCandidates[0]
                          .daysSinceLastScrape
                          ? `${sourcesStatus.nextScrapingCandidates[0].daysSinceLastScrape}d`
                          : t("admin.sources.detail.never"),
                      })}
                    </Text>
                  )}
              </Box>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Quick Actions & Management */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} mb="md">
              {t("admin.eventSources")}
            </Title>
            <Text c="dimmed" mb="lg">
              {t("admin.manageSourcesDescription")}
            </Text>

            {sourcesStatus && (
              <Stack gap="xs" mb="lg">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t("admin.totalSources")}
                  </Text>
                  <Text fw={500}>{sourcesStatus.totalSources}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t("admin.active")}
                  </Text>
                  <Text fw={500} c="green">
                    {sourcesStatus.activeSources}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t("admin.needScraping")}
                  </Text>
                  <Text fw={500} c="red">
                    {sourcesStatus.sourcesNeedingScraping}
                  </Text>
                </Group>
              </Stack>
            )}

            <Stack gap="sm">
              <Button
                onClick={onNavigateToSources}
                leftSection={<IconSettings size={16} />}
                fullWidth
              >
                {t("admin.manageSources")}
              </Button>

              <Button
                onClick={handleFixMissingSchedules}
                color="orange"
                fullWidth
                leftSection={<IconTool size={16} />}
                loading={isFixingSchedules}
              >
                {isFixingSchedules
                  ? t("admin.checking")
                  : t("admin.fixMissingSchedules")}
              </Button>
            </Stack>
          </Card>

          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} mb="lg">
              {t("admin.systemOperations")}
            </Title>
            <Stack gap="md">
              <Button
                onClick={() => {
                  setIsGeneratingEmbeddings(true);
                  generateMissingEmbeddings({})
                    .then((result) => {
                      notifications.show({
                        title: t("common.success"),
                        message: t("admin.generatedEmbeddings", {
                          processed: result.processed,
                          failed: result.failed,
                        }),
                        color: "green",
                      });
                    })
                    .catch(onApiError)
                    .finally(() => setIsGeneratingEmbeddings(false));
                }}
                disabled={isGeneratingEmbeddings}
                color="grape"
                fullWidth
                leftSection={<IconBrain size={16} />}
                loading={isGeneratingEmbeddings}
              >
                {isGeneratingEmbeddings
                  ? t("admin.generating")
                  : t("admin.generateMissingEmbeddings")}
              </Button>

              <Button
                onClick={onNavigateToSubscriptionDebug}
                color="orange"
                fullWidth
                leftSection={<IconMail size={16} />}
              >
                {t("admin.debugSubscriptions")}
              </Button>

              <Button
                onClick={() => {
                  const convexUrl = import.meta.env.VITE_CONVEX_URL;
                  const deploymentId = convexUrl?.split(".")[0]?.split("//")[1];
                  const dashboardUrl = deploymentId
                    ? `https://dashboard.convex.dev/d/${deploymentId}`
                    : "https://dashboard.convex.dev";
                  window.open(dashboardUrl, "_blank");
                }}
                color="blue"
                fullWidth
                leftSection={<IconExternalLink size={16} />}
              >
                {t("admin.openConvexDashboard")}
              </Button>

              <Button
                onClick={handleDeleteAllEvents}
                color="red"
                fullWidth
                leftSection={<IconTrash size={16} />}
                loading={isDeletingAllEvents}
              >
                {isDeletingAllEvents
                  ? t("admin.deleting")
                  : t("admin.deleteAllEvents")}
              </Button>

              <Button
                onClick={handleClearAllWorkpools}
                color="orange"
                fullWidth
                leftSection={<IconBrush size={16} />}
                loading={isClearingAllWorkpools}
              >
                {isClearingAllWorkpools
                  ? t("admin.clearing")
                  : t("admin.clearAllWorkpools")}
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                {t("admin.allOperationsLogged")}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Workpools Status */}
        <Card shadow="sm" padding="xl" radius="lg" withBorder>
          <Title order={3} size="lg" mb="md">
            <Group gap="xs">
              <IconCpu size={20} />
              {t("admin.workpoolStatus")}
            </Group>
          </Title>

          {workpoolsStatus ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
              {/* Event Scraping Workpool */}
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
                onClick={() => onNavigateToWorkpoolDebug("eventScrapeWorkpool")}
              >
                <Group justify="space-between" align="flex-start" mb="sm">
                  <Text size="xl">🕷️</Text>
                  <Badge color="yellow" size="sm">
                    {workpoolsStatus.eventScrapeWorkpool.queuedJobs}{" "}
                    {
                      t("admin.scheduled", {
                        count: workpoolsStatus.eventScrapeWorkpool.queuedJobs,
                      }).split(" ")[0]
                    }
                  </Badge>
                </Group>
                <Title order={4} size="md" mb="xs">
                  {workpoolsStatus.eventScrapeWorkpool.name}
                </Title>
                <Text size="sm" c="dimmed" mb="sm">
                  {workpoolsStatus.eventScrapeWorkpool.description}
                </Text>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t("admin.max", {
                      count: workpoolsStatus.eventScrapeWorkpool.maxParallelism,
                    })}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    rightSection={<IconExternalLink size={12} />}
                  >
                    {t("admin.viewDetails")}
                  </Button>
                </Group>
              </Card>

              {/* Embedding Generation Workpool */}
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onNavigateToWorkpoolDebug("eventEmbeddingWorkpool")
                }
              >
                <Group justify="space-between" align="flex-start" mb="sm">
                  <Text size="xl">🧠</Text>
                  <Badge color="grape" size="sm">
                    {workpoolsStatus.eventEmbeddingWorkpool.queuedJobs}{" "}
                    {
                      t("admin.scheduled", {
                        count:
                          workpoolsStatus.eventEmbeddingWorkpool.queuedJobs,
                      }).split(" ")[0]
                    }
                  </Badge>
                </Group>
                <Title order={4} size="md" mb="xs">
                  {workpoolsStatus.eventEmbeddingWorkpool.name}
                </Title>
                <Text size="sm" c="dimmed" mb="sm">
                  {workpoolsStatus.eventEmbeddingWorkpool.description}
                </Text>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t("admin.max", {
                      count:
                        workpoolsStatus.eventEmbeddingWorkpool.maxParallelism,
                    })}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    rightSection={<IconExternalLink size={12} />}
                  >
                    {t("admin.viewDetails")}
                  </Button>
                </Group>
              </Card>

              {/* Subscription Matching Workpool */}
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onNavigateToWorkpoolDebug("subscriptionMatchWorkpool")
                }
              >
                <Group justify="space-between" align="flex-start" mb="sm">
                  <Text size="xl">🎯</Text>
                  <Badge color="blue" size="sm">
                    {workpoolsStatus.subscriptionMatchWorkpool.queuedJobs}{" "}
                    {
                      t("admin.scheduled", {
                        count:
                          workpoolsStatus.subscriptionMatchWorkpool.queuedJobs,
                      }).split(" ")[0]
                    }
                  </Badge>
                </Group>
                <Title order={4} size="md" mb="xs">
                  {workpoolsStatus.subscriptionMatchWorkpool.name}
                </Title>
                <Text size="sm" c="dimmed" mb="sm">
                  {workpoolsStatus.subscriptionMatchWorkpool.description}
                </Text>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t("admin.max", {
                      count:
                        workpoolsStatus.subscriptionMatchWorkpool
                          .maxParallelism,
                    })}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    rightSection={<IconExternalLink size={12} />}
                  >
                    {t("admin.viewDetails")}
                  </Button>
                </Group>
              </Card>

              {/* Subscription Email Workpool */}
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onNavigateToWorkpoolDebug("subscriptionEmailWorkpool")
                }
              >
                <Group justify="space-between" align="flex-start" mb="sm">
                  <Text size="xl">📧</Text>
                  <Badge color="green" size="sm">
                    {workpoolsStatus.subscriptionEmailWorkpool?.queuedJobs || 0}{" "}
                    {
                      t("admin.scheduled", {
                        count:
                          workpoolsStatus.subscriptionEmailWorkpool
                            ?.queuedJobs || 0,
                      }).split(" ")[0]
                    }
                  </Badge>
                </Group>
                <Title order={4} size="md" mb="xs">
                  {workpoolsStatus.subscriptionEmailWorkpool?.name ||
                    t("admin.subscriptionEmailSending")}
                </Title>
                <Text size="sm" c="dimmed" mb="sm">
                  {workpoolsStatus.subscriptionEmailWorkpool?.description ||
                    t("admin.sendsEmailNotifications")}
                </Text>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t("admin.max", {
                      count:
                        workpoolsStatus.subscriptionEmailWorkpool
                          ?.maxParallelism || 2,
                    })}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    rightSection={<IconExternalLink size={12} />}
                  >
                    {t("admin.viewDetails")}
                  </Button>
                </Group>
              </Card>
            </SimpleGrid>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              {t("common.loading")}
            </Text>
          )}
        </Card>

        {/* Recent Activity */}
        {jobsStatus?.recentJobs && jobsStatus.recentJobs.length > 0 && (
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} size="lg" mb="md">
              {t("admin.recentSystemActivity")}
            </Title>
            <Stack gap="sm">
              {jobsStatus.recentJobs.map((job: any) => (
                <Group key={job._id} justify="space-between">
                  <Box>
                    <Text fw={500} size="sm">
                      {job.kind === "batch_event_scrape"
                        ? t("admin.batchEventScraping")
                        : t("admin.batchSourceScraping")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatRelativeTimeBidirectional(job.startedAt)}
                      {job.completedAt &&
                        t("admin.duration", {
                          minutes: Math.round(
                            (job.completedAt - job.startedAt) / 1000 / 60,
                          ),
                        })}
                    </Text>
                  </Box>
                  <Group gap="xs">
                    <Badge color={getStatusColor(job.status)} size="sm">
                      {job.status}
                    </Badge>
                    {job.status === "completed" && (
                      <ThemeIcon size="sm" color="green" variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    )}
                    {job.status === "failed" && (
                      <ThemeIcon size="sm" color="red" variant="light">
                        <IconX size={12} />
                      </ThemeIcon>
                    )}
                  </Group>
                </Group>
              ))}
            </Stack>
          </Card>
        )}

        {/* Notification Testing */}
        <Card shadow="sm" padding="xl" radius="lg" withBorder>
          <Title order={3} mb="lg">
            🔔 {t("admin.notificationTesting")}
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            {t("admin.testNotificationDescription")}
          </Text>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <Button
              onClick={() => {
                notifications.show({
                  title: t("admin.testSuccess"),
                  message: t("admin.successNotification"),
                  color: "green",
                });
              }}
              color="green"
              leftSection={<IconBell size={16} />}
              size="sm"
            >
              {t("admin.testSuccess")}
            </Button>

            <Button
              onClick={() => {
                notifications.show({
                  title: t("admin.testError"),
                  message: t("admin.errorNotification"),
                  color: "red",
                });
              }}
              color="red"
              leftSection={<IconBellRinging size={16} />}
              size="sm"
            >
              {t("admin.testError")}
            </Button>

            <Button
              onClick={() => {
                notifications.show({
                  title: t("admin.testWarning"),
                  message: t("admin.warningNotification"),
                  color: "yellow",
                });
              }}
              color="yellow"
              leftSection={<IconBell size={16} />}
              size="sm"
            >
              {t("admin.testWarning")}
            </Button>

            <Button
              onClick={() => {
                notifications.show({
                  title: t("admin.testInfo"),
                  message: t("admin.infoNotification"),
                  color: "blue",
                });
              }}
              color="blue"
              leftSection={<IconBell size={16} />}
              size="sm"
            >
              {t("admin.testInfo")}
            </Button>
          </SimpleGrid>

          <Divider my="md" />

          <Button
            onClick={() => {
              notifications.show({
                id: "test-loading",
                title: t("common.loading"),
                message: t("admin.loadingNotification"),
                color: "blue",
                loading: true,
                autoClose: false,
              });

              setTimeout(() => {
                notifications.update({
                  id: "test-loading",
                  title: t("common.success"),
                  message: t("admin.completeNotification"),
                  color: "green",
                  loading: false,
                  autoClose: 5000,
                });
              }, 2000);
            }}
            variant="light"
            fullWidth
            leftSection={<IconBellRinging size={16} />}
            size="sm"
          >
            {t("admin.testLoadingSuccess")}
          </Button>
        </Card>
      </Stack>
    </Container>
  );
}
