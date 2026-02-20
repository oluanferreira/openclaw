"use client";

import { useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Badge } from "@workspace/ui-web/badge";
import { Icons } from "@workspace/ui-web/icons";
import { Marquee } from "@workspace/ui-web/marquee";

import {
  Section,
  SectionHeader,
  SectionTitle,
} from "~/modules/marketing/layout/section";

const useUseCases = () => {
  const { t } = useTranslation("marketing");

  return [
    {
      label: t("useCases.case.readSummarizeEmail"),
      icon: Icons.Mail,
    },
    {
      label: t("useCases.case.draftReplies"),
      icon: Icons.SendHorizontal,
    },
    {
      label: t("useCases.case.translateMessagesRealtime"),
      icon: Icons.Globe2,
    },
    {
      label: t("useCases.case.organizeInbox"),
      icon: Icons.Filter,
    },
    {
      label: t("useCases.case.answerSupportTickets"),
      icon: Icons.LifeBuoy,
    },
    {
      label: t("useCases.case.summarizeLongDocuments"),
      icon: Icons.BookOpen,
    },
    {
      label: t("useCases.case.notifyBeforeMeeting"),
      icon: Icons.Bell,
    },
    {
      label: t("useCases.case.scheduleMeetingsFromChat"),
      icon: Icons.Calendar,
    },
    {
      label: t("useCases.case.remindDeadlines"),
      icon: Icons.ClockFading,
    },
    {
      label: t("useCases.case.planYourWeek"),
      icon: Icons.ChartNoAxesGantt,
    },
    {
      label: t("useCases.case.takeMeetingNotes"),
      icon: Icons.BookOpen,
    },
    {
      label: t("useCases.case.syncAcrossTimeZones"),
      icon: Icons.Globe2,
    },
    {
      label: t("useCases.case.doYourTaxes"),
      icon: Icons.Calculator,
    },
    {
      label: t("useCases.case.trackExpensesReceipts"),
      icon: Icons.CreditCard,
    },
    {
      label: t("useCases.case.compareInsuranceQuotes"),
      icon: Icons.ShieldUser,
    },
    {
      label: t("useCases.case.manageSubscriptions"),
      icon: Icons.Settings2,
    },
    {
      label: t("useCases.case.runPayrollCalculations"),
      icon: Icons.HandCoins,
    },
    {
      label: t("useCases.case.negotiateRefunds"),
      icon: Icons.TrendingUp,
    },
    {
      label: t("useCases.case.findCoupons"),
      icon: Icons.Gift,
    },
    {
      label: t("useCases.case.findBestPricesOnline"),
      icon: Icons.Search,
    },
    {
      label: t("useCases.case.findDiscountCodes"),
      icon: Icons.Code,
    },
    {
      label: t("useCases.case.priceDropAlerts"),
      icon: Icons.ArrowDown,
    },
    {
      label: t("useCases.case.compareProductSpecs"),
      icon: Icons.Filter,
    },
    {
      label: t("useCases.case.negotiateDeals"),
      icon: Icons.MessageCircle,
    },
    {
      label: t("useCases.case.writeContractsNdas"),
      icon: Icons.ShieldUser,
    },
    {
      label: t("useCases.case.researchCompetitors"),
      icon: Icons.Search,
    },
    {
      label: t("useCases.case.screenPrioritizeLeads"),
      icon: Icons.UsersRound,
    },
    {
      label: t("useCases.case.generateInvoices"),
      icon: Icons.HandCoins,
    },
    {
      label: t("useCases.case.createPresentationsFromBullets"),
      icon: Icons.PaintBucket,
    },
    {
      label: t("useCases.case.bookTravelHotels"),
      icon: Icons.Globe2,
    },
    {
      label: t("useCases.case.findRecipesFromIngredients"),
      icon: Icons.BookOpen,
    },
    {
      label: t("useCases.case.draftSocialPosts"),
      icon: Icons.MessageCircle,
    },
    {
      label: t("useCases.case.monitorNewsAlerts"),
      icon: Icons.Bell,
    },
    {
      label: t("useCases.case.setTrackGoals"),
      icon: Icons.TrendingUp,
    },
    {
      label: t("useCases.case.screenColdOutreach"),
      icon: Icons.SendHorizontal,
    },
    {
      label: t("useCases.case.draftJobDescriptions"),
      icon: Icons.UserRound,
    },
    {
      label: t("useCases.case.runStandupSummaries"),
      icon: Icons.ClockFading,
    },
    {
      label: t("useCases.case.trackOkrsKpis"),
      icon: Icons.ChartNoAxesGantt,
    },
  ];
};

export const UseCases = () => {
  const { t } = useTranslation("marketing");
  const useCases = useUseCases();

  const itemsPerRow = Math.ceil(useCases.length / 5);
  const groups = Array.from({ length: 5 }, (_, i) =>
    useCases.slice(i * itemsPerRow, (i + 1) * itemsPerRow),
  );

  return (
    <Section className="gap-8 overflow-hidden py-14 md:gap-10 md:py-20">
      <SectionHeader className="max-w-4xl">
        <SectionTitle className="text-3xl text-balance md:text-4xl lg:text-5xl">
          <span>{t("useCases.title")}</span>
          <span className="text-muted-foreground/75 mt-1 block lg:mt-2">
            {t("useCases.subtitle")}
          </span>
        </SectionTitle>
      </SectionHeader>

      <div className="relative w-full">
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r to-transparent md:w-24" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l to-transparent md:w-24" />
        <div className="flex w-full flex-col gap-2">
          {groups.map((group, index) => (
            <Marquee
              key={index}
              reverse={index % 2 === 0}
              pauseOnHover
              className="[--duration:45s] [--gap:0.5rem] sm:[--gap:0.75rem]"
              repeat={3}
            >
              {group.map((item, index) => (
                <Badge
                  key={item.label}
                  variant="outline"
                  className={cn("gap-2 rounded-xl px-4 py-2.5 text-sm", {
                    "shadow-xs": index % 5 === 0,
                    "border-dashed": index % 5 === 1,
                    "from-accent/10 to-accent/20 bg-linear-to-r":
                      index % 5 === 2,
                    "border-dotted": index % 5 === 3,
                  })}
                >
                  <item.icon className="text-muted-foreground size-4" />
                  {item.label}
                </Badge>
              ))}
            </Marquee>
          ))}
        </div>
      </div>

      <span className="text-muted-foreground text-center text-sm text-pretty italic sm:text-base">
        {t("useCases.note")}
      </span>
    </Section>
  );
};
