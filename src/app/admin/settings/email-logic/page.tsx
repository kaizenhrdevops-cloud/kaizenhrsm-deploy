// src/app/admin/settings/email-logic/page.tsx
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Container from "@/components/layout/Container";
import {
  ArrowLeft,
  Clock,
  Mail,
  AlertTriangle,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function EmailLogicPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 py-8">
          <Container>
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6 transition-colors font-medium group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Settings
                </Link>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Email System Logic
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Understanding daily quotas, queues, and safety mechanisms
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Daily Limit
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        100
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Resend Free Tier
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Priority System
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        Active
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Transactional First
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Queue System
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        Enabled
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Auto-Resume Daily
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* 1. The Core Concept */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 rounded-xl shadow-lg flex-shrink-0">
                      <ShieldAlert className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        Why Daily Limits Exist
                      </h2>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          Your email provider (Resend Free Tier) enforces a
                          strict limit of{" "}
                          <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-semibold text-sm">
                            100 emails per 24 hours
                          </span>
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>What happens at email #101?</strong>
                            <br />
                            The provider blocks the request and may flag your
                            account for spam-like behavior, potentially leading
                            to suspension.
                          </p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                          Our system acts as a <strong>Safety Valve</strong>,
                          intelligently calculating your remaining quota before
                          sending newsletters, ensuring critical transactional
                          emails always get through.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Visual Timeline */}
                <div className="p-8 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/30">
                  <div className="flex items-center space-x-3 mb-8">
                    <Calendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      24-Hour Cycle Visualization
                    </h3>
                  </div>

                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-indigo-400 to-gray-400 rounded-full"></div>

                    <div className="space-y-8 relative">
                      {/* Event 1 - Morning Activity */}
                      <div className="relative pl-20">
                        <div className="absolute left-0 w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-lg border-4 border-green-400 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs font-bold text-green-600 dark:text-green-400">
                              09:00
                            </div>
                            <div className="text-[10px] text-gray-500">AM</div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-xl transition-shadow">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  Transactional Activity
                                </h4>
                              </div>
                              <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                                High Priority
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                              Throughout the day, users interact with "Contact
                              Us" forms, account verifications, password resets,
                              and newsletter signups.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Send className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Emails Sent
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                  20
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Remaining
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  80
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event 2 - Cron Job */}
                      <div className="relative pl-20">
                        <div className="absolute left-0 w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-lg border-4 border-indigo-400 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              11:00
                            </div>
                            <div className="text-[10px] text-gray-500">PM</div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-xl transition-shadow">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  Newsletter Cron Job Executes
                                </h4>
                              </div>
                              <span className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                                Scheduled Task
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                              You have{" "}
                              <strong className="text-indigo-600 dark:text-indigo-400">
                                150 subscribers
                              </strong>{" "}
                              waiting in queue. The system performs a quota
                              check and discovers{" "}
                              <strong>100 emails remaining</strong> today
                              (limit is configurable in settings).
                            </p>
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                                    Smart Batch Processing
                                  </p>
                                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                    Sends 10 per hourly tick, ~600ms apart
                                    (Resend free allows ~2/sec), then keeps
                                    the rest queued. Recipients who
                                    unsubscribed since scheduling are skipped,
                                    and rate-limited sends retry next tick.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Processed
                                </div>
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                  10
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Queued
                                </div>
                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                  140
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Quota Left
                                </div>
                                <div className="text-xl font-bold text-gray-400">
                                  90
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event 3 - Next Day */}
                      <div className="relative pl-20">
                        <div className="absolute left-0 w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-lg border-4 border-gray-400 flex items-center justify-center">
                          <div className="text-center">
                            <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-xl transition-shadow">
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-3">
                              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                Next Day - Queue Resumes
                              </h4>
                            </div>
                          </div>
                          <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                              The 140 remaining subscribers stay queued. Each
                              hourly tick sends the next 10 within that
                              day&apos;s available quota, and continues the
                              next day until done.
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">
                                Automatic continuation - no data loss
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Warning Section */}
                <div className="p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-t border-red-100 dark:border-red-900/30">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-3.5 rounded-xl shadow-lg flex-shrink-0">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-3 flex items-center">
                        Danger Zone: Misconfigured Limits
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
                        If you increase the admin panel setting to{" "}
                        <span className="inline-flex items-center px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md font-bold text-sm">
                          1000 emails
                        </span>{" "}
                        but your Resend plan remains at{" "}
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-bold text-sm">
                          100 emails
                        </span>
                        :
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              System attempts 1000 sends
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              But only 100 are allowed by provider
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              Emails #101-1000 wait in queue
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              The per-tick quota gate caps each run — overflow
                              stays queued for the next tick/day instead of
                              sending
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              Delivery stretches over ~10 days
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              900 subscribers at 100/day — nothing is lost,
                              but it is slow
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 bg-red-600 dark:bg-red-700 p-4 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white text-sm">
                              CRITICAL: Transactional Emails Fail
                            </div>
                            <div className="text-xs text-red-100 mt-1">
                              Password resets, contact forms, and verifications
                              stop working for the rest of the day
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900 dark:text-amber-300 text-sm mb-1">
                              Best Practice
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-400">
                              Always match your admin panel limit with your
                              actual email provider plan. Never exceed your
                              provider's documented quota.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Reference Card */}
              <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Mail className="w-6 h-6 mr-3" />
                  Quick Reference
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-100">
                      Safe Configuration
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-50">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Match admin limit with provider plan</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Reserve quota for transactional emails</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Monitor daily usage patterns</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-100">
                      How Queuing Works
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-50">
                      <li className="flex items-start">
                        <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Quota check before each batch</span>
                      </li>
                      <li className="flex items-start">
                        <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Automatic resume next day</span>
                      </li>
                      <li className="flex items-start">
                        <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>No manual intervention required</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
