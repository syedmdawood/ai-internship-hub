"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Domain = {
	id: string;
	name: string;
};

type Question = {
	id: string;
	question_text: string;
	options: string[];
	domains?: {
		name: string;
	} | null;
};

type DomainScoreMap = Record<
	string,
	{
		correct: number;
		total: number;
		percentage: number;
	}
>;

type AssessmentResult = {
	recommendedDomains: string[];
	selectedDomains: string[];
	skillLevel: string;
	aiRecommendation: string;
	totalScore: number;
	totalQuestions: number;
	percentageScore: number;
	domainScores: DomainScoreMap;
};

type AssessmentResultRow = {
	id: string;
	user_id: string;
	domain_scores: DomainScoreMap | null;
	recommended_domain: unknown;
	total_score: number | null;
	attempted_at: string | null;
	skill_level: string | null;
	selected_domains: unknown;
	total_questions: number | null;
	percentage_score: number | string | null;
	ai_recommendation: string | null;
	secondary_recommendations: unknown;
	completed_at: string | null;
	status: string;
};

type QuestionRow = {
	id: string;
	question_text: string;
	options: unknown;
	domains?: { name: string } | { name: string }[] | null;
};

function toStringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => String(item)).filter(Boolean);
	}

	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed.map((item) => String(item)).filter(Boolean);
			}
		} catch {
			return value ? [value] : [];
		}
	}

	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;

		if (Array.isArray(obj.domains)) {
			return obj.domains.map((item) => String(item)).filter(Boolean);
		}

		if (typeof obj.name === "string") {
			return [obj.name];
		}

		if (typeof obj.primary === "string") {
			return [obj.primary];
		}
	}

	return [];
}

function normalizeDomainScores(value: unknown): DomainScoreMap {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	const raw = value as Record<string, unknown>;
	const normalized: DomainScoreMap = {};

	for (const [key, score] of Object.entries(raw)) {
		if (score && typeof score === "object" && !Array.isArray(score)) {
			const s = score as Record<string, unknown>;

			normalized[key] = {
				correct: Number(s.correct ?? 0),
				total: Number(s.total ?? 0),
				percentage: Number(s.percentage ?? 0),
			};
		}
	}

	return normalized;
}

function mapDbRowToUiResult(row: AssessmentResultRow): AssessmentResult {
	return {
		recommendedDomains: toStringArray(row.recommended_domain),
		selectedDomains: toStringArray(row.selected_domains),
		skillLevel: row.skill_level || "Not available",
		aiRecommendation: row.ai_recommendation || "No AI recommendation available.",
		totalScore: Number(row.total_score ?? 0),
		totalQuestions: Number(row.total_questions ?? 0),
		percentageScore: Number(row.percentage_score ?? 0),
		domainScores: normalizeDomainScores(row.domain_scores),
	};
}

export default function AssessmentPage() {
	const [domains, setDomains] = useState<Domain[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);

	const [loadingDomains, setLoadingDomains] = useState(true);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [checkingExistingResult, setCheckingExistingResult] = useState(true);

	const [userId, setUserId] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [existingResult, setExistingResult] = useState<AssessmentResult | null>(null);

	const [started, setStarted] = useState(false);
	const [showDomainSelect, setShowDomainSelect] = useState(false);
	const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [timeLeft, setTimeLeft] = useState(300);

	const [showResult, setShowResult] = useState(false);
	const [result, setResult] = useState<AssessmentResult | null>(null);

	const displayedResult = useMemo(() => result || existingResult, [result, existingResult]);

	useEffect(() => {
		const initPage = async () => {
			try {
				setCheckingExistingResult(true);
				setLoadingDomains(true);

				const [authResponse, domainsResponse] = await Promise.all([
					supabase.auth.getUser(),
					supabase
						.from("domains")
						.select("id, name")
						.eq("is_active", true)
						.order("display_order", { ascending: true }),
				]);

				const currentUser = authResponse.data.user;

				if (authResponse.error || !currentUser) {
					setIsAuthenticated(false);
					setUserId(null);
					setExistingResult(null);
				} else {
					setIsAuthenticated(true);
					setUserId(currentUser.id);

					const { data: latestResult, error: resultError } = await supabase
						.from("assessment_results")
						.select(
							`
							id,
							user_id,
							domain_scores,
							recommended_domain,
							total_score,
							attempted_at,
							skill_level,
							selected_domains,
							total_questions,
							percentage_score,
							ai_recommendation,
							secondary_recommendations,
							completed_at,
							status
						`,
						)
						.eq("user_id", currentUser.id)
						.eq("status", "completed")
						.order("completed_at", { ascending: false })
						.limit(1)
						.maybeSingle<AssessmentResultRow>();

					if (resultError) {
						console.error("Failed to load existing assessment:", resultError);
						setExistingResult(null);
					} else if (latestResult) {
						setExistingResult(mapDbRowToUiResult(latestResult));
					} else {
						setExistingResult(null);
					}
				}

				if (!domainsResponse.error && domainsResponse.data) {
					setDomains(domainsResponse.data);
				} else {
					console.error(domainsResponse.error);
				}
			} catch (error) {
				console.error("Initialization failed:", error);
			} finally {
				setCheckingExistingResult(false);
				setLoadingDomains(false);
			}
		};

		initPage();
	}, []);

	const fetchQuestions = async () => {
		setLoadingQuestions(true);

		const { data, error } = await supabase.from("questions").select(`
			id,
			question_text,
			options,
			domains ( name )
		`);

		if (!error && data) {
			const filtered = (data as QuestionRow[]).filter((q) => {
				const domainName = Array.isArray(q.domains) ? q.domains[0]?.name || "" : q.domains?.name || "";
				return selectedDomains.includes(domainName);
			});

			const parsed: Question[] = filtered.map((q) => {
				let options = q.options;

				if (typeof options === "string") {
					try {
						options = JSON.parse(options);
					} catch {
						options = [];
					}
				}

				const domainName = Array.isArray(q.domains) ? q.domains[0]?.name || null : q.domains?.name || null;

				return {
					id: q.id,
					question_text: q.question_text,
					options: Array.isArray(options) ? options.map((option) => String(option)) : [],
					domains: domainName ? { name: domainName } : null,
				};
			});

			parsed.sort(() => Math.random() - 0.5);
			setQuestions(parsed.slice(0, 30));
		} else {
			console.error(error);
		}

		setLoadingQuestions(false);
	};

	useEffect(() => {
		if (started && selectedDomains.length) {
			fetchQuestions();
		}
	}, [started, selectedDomains]);

	useEffect(() => {
		if (!started || showResult || submitting || questions.length === 0) return;

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					void handleSubmitAssessment();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [started, showResult, submitting, questions.length]);

	const handleAnswer = (questionId: string, selectedOption: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: selectedOption,
		}));
	};

	const handleNext = () => {
		if (currentQuestion < questions.length - 1) {
			setCurrentQuestion((prev) => prev + 1);
			return;
		}

		void handleSubmitAssessment();
	};

	const handlePrevious = () => {
		if (currentQuestion > 0) {
			setCurrentQuestion((prev) => prev - 1);
		}
	};

	const handleStartAssessment = () => {
		if (!isAuthenticated) {
			alert("Please login first to start the assessment.");
			return;
		}

		setSelectedDomains([]);
		setShowDomainSelect(true);
	};

	const openDomainSelection = () => {
		setSelectedDomains([]);
		setShowDomainSelect(true);
	};

	const handleSubmitAssessment = async () => {
		if (submitting) return;
		setSubmitting(true);

		try {
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError || !session?.access_token || !userId) {
				throw new Error("User not authenticated");
			}

			const res = await fetch("/api/assessment/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({
					selectedDomains,
					answers,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to submit assessment");
			}

			const submittedResult: AssessmentResult = {
				recommendedDomains: toStringArray(data.recommendedDomains),
				selectedDomains: [...selectedDomains],
				skillLevel: data.skillLevel || "Not available",
				aiRecommendation: data.aiRecommendation || "No AI recommendation available.",
				totalScore: Number(data.totalScore ?? 0),
				totalQuestions: Number(data.totalQuestions ?? 0),
				percentageScore: Number(data.percentageScore ?? 0),
				domainScores: normalizeDomainScores(data.domainScores),
			};

			setResult(submittedResult);
			setExistingResult(submittedResult);
			setShowResult(true);
			setStarted(false);
		} catch (error) {
			console.error("Assessment submit failed:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const resetAssessment = () => {
		setStarted(false);
		setShowDomainSelect(false);
		setSelectedDomains([]);
		setQuestions([]);
		setCurrentQuestion(0);
		setAnswers({});
		setTimeLeft(300);
		setResult(null);
		setShowResult(false);
	};

	const startTestAgain = () => {
		setStarted(false);
		setSelectedDomains([]);
		setQuestions([]);
		setCurrentQuestion(0);
		setAnswers({});
		setTimeLeft(300);
		setShowResult(false);
		setResult(null);           // Clear current result to exit the result screen
		openDomainSelection();      // Open domain selection dialog
	};

	if (checkingExistingResult || loadingDomains) {
		return <p>Loading assessment...</p>;
	}

	// Render domain selection dialog first, before any screen returns
	// This ensures it's always accessible from any page state
	const domainDialog = (
		<Dialog open={showDomainSelect} onOpenChange={setShowDomainSelect}>
			<DialogContent className="overflow-hidden border-border/60 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-2xl shadow-slate-950/40 sm:max-w-2xl">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_30%)]" />
				<div className="relative space-y-6">
					<DialogHeader className="text-left">
						<DialogTitle className="text-2xl">Choose your domains</DialogTitle>
						<DialogDescription className="text-slate-300">
							Pick up to 3 domains to shape the question set before the test starts.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
						If you have existing result data, it stays on the page until this new attempt is submitted.
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						{domains.map((domain) => {
							const selected = selectedDomains.includes(domain.name);

							return (
								<button
									key={domain.id}
									type="button"
									onClick={() => {
										if (selected) {
											setSelectedDomains((prev) => prev.filter((d) => d !== domain.name));
										} else if (selectedDomains.length < 3) {
											setSelectedDomains((prev) => [...prev, domain.name]);
										}
									}}
									className={cn(
										"group rounded-2xl border p-4 text-left transition-all duration-200",
										"bg-white/5 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-white/10",
										selected ? "border-cyan-300 bg-cyan-300/15 ring-1 ring-cyan-300/40" : "border-white/10",
									)}
								>
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-medium text-white">{domain.name}</p>
											<p className="mt-1 text-xs text-slate-300">{selected ? "Selected" : "Tap to add to your test"}</p>
										</div>
										<div className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition", selected ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/15 bg-white/5 text-slate-300 group-hover:border-cyan-300/50")}>
											{selected ? "✓" : "+"}
										</div>
									</div>
								</button>
							);
						})}
					</div>

					<div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
						<span>Selected domains: {selectedDomains.length}/3</span>
						<span className="text-slate-400">{selectedDomains.length ? selectedDomains.join(", ") : "None yet"}</span>
					</div>

					<Button
						className="w-full rounded-full"
						disabled={!selectedDomains.length}
						onClick={() => {
							setShowDomainSelect(false);
							setStarted(true);
						}}
					>
						Start Test
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);

	if (!started && displayedResult) {
		return (
			<>
				{domainDialog}
				<div className="space-y-6">
				<div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/30">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_30%)]" />
					<div className="relative space-y-2">
						<p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-200/80">Skill Assessment</p>
						<h1 className="text-3xl font-semibold tracking-tight">Your previous result</h1>
						<p className="max-w-2xl text-sm text-slate-300">
							Review your latest assessment outcome or restart with a new domain selection.
						</p>
						<div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-200/80">
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">Completed</Badge>
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">AI powered</Badge>
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">Ready to retake</Badge>
						</div>
					</div>
				</div>

				<Card className="border-border/60 shadow-lg shadow-slate-950/5">
					<CardHeader>
						<CardTitle className="text-xl">Assessment Summary</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border bg-muted/40 p-4">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended domains</p>
								<div className="mt-2 flex flex-wrap gap-2">
									{displayedResult.selectedDomains
										.map((domain) => ({
											domain,
											score: displayedResult.domainScores[domain]?.percentage || 0,
										}))
										.sort((a, b) => b.score - a.score)
										.map((item, index) => (
											<Badge key={item.domain} variant="secondary" className="rounded-full px-3 py-1">
												{index + 1}. {item.domain}
											</Badge>
										))}
								</div>
							</div>
							<div className="rounded-2xl border bg-muted/40 p-4">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Skill level</p>
								<p className="mt-2 text-lg font-semibold">{displayedResult.skillLevel}</p>
							</div>
							<div className="rounded-2xl border bg-muted/40 p-4">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
								<p className="mt-2 text-lg font-semibold">{displayedResult.totalScore} / {displayedResult.totalQuestions}</p>
								<p className="text-sm text-muted-foreground">{displayedResult.percentageScore}% overall</p>
							</div>
						</div>

						<div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">AI Recommendation</p>
							<p className="mt-2 text-sm leading-6 text-foreground/90">{displayedResult.aiRecommendation}</p>
						</div>

						<Button onClick={startTestAgain} className="w-full rounded-full">
							Start Test Again <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

	if (!started) {
		return (
			<>
				{domainDialog}
				<div className="space-y-6">
					<div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/30">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%)]" />
						<div className="relative space-y-3">
							<p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-200/80">Assessment</p>
							<h1 className="text-3xl font-semibold tracking-tight">Freelancing Skill Assessment</h1>
							<p className="max-w-2xl text-sm text-slate-300">
								Select up to 3 domains and take a timed assessment to get a personalized freelancing direction.
							</p>
							<div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-200/80">
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">30 questions</Badge>
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">5 minute timer</Badge>
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/15">AI recommendation</Badge>
							</div>
						</div>
					</div>

					<Card className="border-border/60 shadow-lg shadow-slate-950/5">
						<CardHeader>
							<CardTitle className="text-xl">Start a new assessment</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm leading-6 text-muted-foreground">
								Use the popup to choose the domains you want to test. The dialog now follows the page theme so the entry flow feels cohesive.
							</p>

							<Button
								onClick={handleStartAssessment}
								className="w-full rounded-full"
								disabled={loadingDomains}
							>
								Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
							</Button>

							{!isAuthenticated && (
								<p className="text-sm text-red-500">Please login first to take the assessment.</p>
							)}
						</CardContent>
					</Card>

				</div>
			</>
		);
	}

	if (loadingQuestions) return <p>Loading questions...</p>;
	if (!questions.length) return <p>No questions found for selected domains.</p>;

	const currentQuestionId = questions[currentQuestion]?.id;
	const hasAnsweredCurrent = !!answers[currentQuestionId];

	return (
		<>
			{domainDialog}
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
					<Badge className="rounded-full px-4 py-2 text-sm font-medium">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</Badge>
					<Badge variant="outline" className="rounded-full px-4 py-2">
						Question {currentQuestion + 1} of {questions.length}
					</Badge>
				</div>

				<Progress value={((currentQuestion + 1) / questions.length) * 100} />

				<Card className="border-border/60 shadow-xl shadow-slate-950/5">
				<CardContent className="space-y-6 p-6 md:p-8">
					<div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
						<span className="h-2 w-2 rounded-full bg-primary" />
						Multiple choice question
					</div>

					<h2 className="text-xl font-semibold leading-relaxed text-foreground md:text-2xl">{questions[currentQuestion]?.question_text}</h2>

					<RadioGroup
						value={answers[currentQuestionId]}
						onValueChange={(val) => handleAnswer(currentQuestionId, val)}
						className="grid gap-3"
					>
						{questions[currentQuestion]?.options.map((opt) => (
							<Label
								key={opt}
								className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all", "border-border/70 bg-muted/20 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5")}
							>
								<RadioGroupItem value={opt} className="mt-0.5" />
								<span className="text-sm leading-6 text-foreground/90">{opt}</span>
							</Label>
						))}
					</RadioGroup>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
						<Button
							variant="outline"
							className="rounded-full"
							onClick={handlePrevious}
							disabled={currentQuestion === 0 || submitting}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Previous
						</Button>

						<Button className="rounded-full" onClick={handleNext} disabled={!hasAnsweredCurrent || submitting}>
							{currentQuestion === questions.length - 1 ? "Submit" : "Next"}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>

			<Dialog open={showResult} onOpenChange={setShowResult}>
				<DialogContent className="overflow-hidden border-border/60 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl shadow-slate-950/40 sm:max-w-2xl">
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_30%)]" />
					<div className="relative space-y-6">
						<DialogHeader className="text-left">
							<DialogTitle className="text-2xl">Assessment Result</DialogTitle>
							<DialogDescription className="text-slate-300">Your answers have been scored and matched against the selected domains.</DialogDescription>
						</DialogHeader>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.24em] text-slate-400">Domains</p>
								<div className="mt-2 flex flex-wrap gap-2">
									{result?.selectedDomains
										.map((domain) => ({
											domain,
											score: result.domainScores[domain]?.percentage || 0,
										}))
										.sort((a, b) => b.score - a.score)
										.map((item, index) => (
											<Badge key={item.domain} className="rounded-full bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/20">
												{index + 1}. {item.domain}
											</Badge>
										))}
								</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.24em] text-slate-400">Skill level</p>
								<p className="mt-2 text-lg font-semibold text-white">{result?.skillLevel}</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score</p>
								<p className="mt-2 text-lg font-semibold text-white">{result?.totalScore} / {result?.totalQuestions}</p>
								<p className="text-sm text-slate-300">{result?.percentageScore}% overall</p>
							</div>
						</div>

						<div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">AI Recommendation</p>
							<p className="mt-2 text-sm leading-6 text-slate-100">{result?.aiRecommendation}</p>
						</div>

						<Button onClick={startTestAgain} className="w-full rounded-full">Start Test Again</Button>
					</div>
				</DialogContent>
			</Dialog>
			</div>
		</>
	);
}
