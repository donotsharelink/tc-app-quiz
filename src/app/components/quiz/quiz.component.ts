import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

interface Question {
  title: string;
  question: string;
  options: string[];
  correct: string;
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  questionsData: Question[] = [];
  currentPage: number = 1;
  questionsPerPage: number = 10;
  userAnswers: { [key: number]: string } = {};
  isSubmitted: boolean = false;
  showModal: boolean = false;
  numCorrect: number = 0;
  currentPart: string = 'part5';
  filterMode: 'all' | 'correct' | 'wrong' | 'skipped' = 'all';
  navigatorOpen: boolean = false;

  // Timer
  elapsedSeconds: number = 0;
  private timerInterval: any = null;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
  
logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']);
}
  // ─── Timer ───────────────────────────────────────────
  startTimer(): void {
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ─── Load & shuffle ───────────────────────────────────
  loadQuestions(): void {
    const part = this.currentPart === 'part5' ? 'part5.json' : 'part7.json';
    this.http.get<Question[]>('assets/data/' + part).subscribe(data => {
      this.questionsData = this.currentPart === 'part5'
        ? this.shuffleQuestions(data)
        : data;
      this.startTimer();
    });
  }

  shuffleQuestions(questions: Question[]): Question[] {
    return [...questions].sort(() => Math.random() - 0.5);
  }

  get quizTitle(): string {
    return this.currentPart === 'part5' ? 'TOEIC Part 5' : 'TOEIC Part 7';
  }

  // ─── Navigation ──────────────────────────────────────
  switchToPart(part: string): void {
    this.currentPart = part;
    this.resetQuiz();
    this.loadQuestions();
  }

  resetQuiz(): void {
    this.isSubmitted = false;
    this.userAnswers = {};
    this.currentPage = 1;
    this.filterMode = 'all';
    this.stopTimer();
    localStorage.removeItem('userAnswers');
  }

  restartQuiz(): void {
    this.resetQuiz();
    this.loadQuestions();
    this.scrollToTop();
  }

  // ─── Question navigation ─────────────────────────────
  goToQuestion(index: number): void {
    this.currentPage = Math.floor(index / this.questionsPerPage) + 1;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  isOnCurrentPage(index: number): boolean {
    const page = Math.floor(index / this.questionsPerPage) + 1;
    return page === this.currentPage;
  }

  getCurrentQuestions(): Question[] {
    return this.questionsData.slice(
      (this.currentPage - 1) * this.questionsPerPage,
      this.currentPage * this.questionsPerPage
    );
  }

  nextPage(): void {
    if (this.currentPage < this.maxPage()) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  maxPage(): number {
    return Math.ceil(this.questionsData.length / this.questionsPerPage);
  }

  // ─── Answers ─────────────────────────────────────────
  countUserAnswers(): number {
    return Object.keys(this.userAnswers).length;
  }

  submitAnswers(): void {
    const unanswered = this.questionsData.filter((_, i) => !this.userAnswers[i]);
    if (unanswered.length > 0) {
      this.showModalFunction();
    } else {
      this.calculateResults();
      this.isSubmitted = true;
      this.stopTimer();
      this.scrollToTop();
    }
  }

  confirmSubmit(): void {
    this.calculateResults();
    this.isSubmitted = true;
    this.stopTimer();
    this.hideModal();
    this.scrollToTop();
  }

  calculateResults(): void {
    this.numCorrect = this.questionsData.reduce((count, q, i) => {
      return count + (this.userAnswers[i] === q.correct ? 1 : 0);
    }, 0);
  }

  // ─── Modal ───────────────────────────────────────────
  showModalFunction(): void {
    this.showModal = true;
  }

  hideModal(): void {
    this.showModal = false;
  }

  // ─── Answer checking ─────────────────────────────────
  isSelectedAnswer(qIndex: number, option: string): boolean {
    return this.userAnswers[qIndex] === option;
  }

  isCorrectAnswer(qIndex: number, option: string): boolean {
    return this.questionsData[qIndex]?.correct === option;
  }

  isWrongAnswer(qIndex: number, option: string): boolean {
    return this.isSelectedAnswer(qIndex, option) && !this.isCorrectAnswer(qIndex, option);
  }

  // ─── Filter ──────────────────────────────────────────
  getWrongCount(): number {
    return this.questionsData.filter((q, i) =>
      this.userAnswers[i] && this.userAnswers[i] !== q.correct
    ).length;
  }

  getSkippedCount(): number {
    return this.questionsData.filter((_, i) => !this.userAnswers[i]).length;
  }

  shouldShowQuestion(index: number): boolean {
    const answered = this.userAnswers[index];
    const correct = this.questionsData[index]?.correct;
    switch (this.filterMode) {
      case 'correct':  return !!answered && answered === correct;
      case 'wrong':    return !!answered && answered !== correct;
      case 'skipped':  return !answered;
      default:         return true;
    }
  }

  // ─── Scroll ──────────────────────────────────────────
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
