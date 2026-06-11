'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Users,
  Percent,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  X,
  Menu,
  BookMarked,
  ExternalLink,
  Home,
  Sun,
  Moon,
  Plus,
  Minus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Course {
  순번: string;
  학기: string;
  '대학(원)': string;
  '학과(부)': string;
  학년: string;
  이수구분: string;
  이수영역: string;
  학수번호: string;
  교과목명: string;
  '교과목명(영문)': string;
  담당교수: string;
  소속: string;
  강의실: string;
  '시간표(교시)': string;
  '시간표(시간)': string;
  교시유형: string;
  학점: string;
  시수: string;
  이론: string;
  실습: string;
  정원: string;
  수강: string;
  '수강(남)': string;
  '수강(여)': string;
  재수강: number;
  수업구분: string;
  수업유형: string;
  집중이수제: string;
  성적평가: string;
  원어강의: string;
  원어강의구분: string;
  원어강사료지급: string;
  캡스톤디자인: string;
  수강대상: string | null;
  수업방법: string | null;
  비고: string | null;
}

function useCountUp(end: number, duration = 1200, decimals = 0): string {
  const [display, setDisplay] = useState(decimals > 0 ? '0.0' : '0');
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = end * eased;

      if (decimals > 0) {
        setDisplay(current.toFixed(decimals));
      } else {
        setDisplay(Math.floor(current).toLocaleString());
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(decimals > 0 ? end.toFixed(decimals) : end.toLocaleString());
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, decimals]);

  return display;
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // AI Modal/Drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const [expandedColleges, setExpandedColleges] = useState<Record<string, boolean>>({});

  const toggleCollege = (college: string) => {
    setExpandedColleges(prev => ({
      ...prev,
      [college]: !prev[college]
    }));
  };

  const handleGenerateAIReport = async () => {
    setIsGeneratingAI(true);
    try {
      const targetName = selectedDept ? `${selectedCollege} ${selectedDept}` : selectedCollege ? selectedCollege : '인천대학교 전체';
      const stats = {
        totalCourses: kpis.totalCourses,
        totalEnrolled: kpis.totalEnrolled,
        enrollmentRate: kpis.enrollmentRate,
        originalLangRatio: kpis.originalLangRatio,
        topCategories: categoryCountsData.slice(0, 3),
        topCategoryAvg: categoryAvgEnrolledData.slice(0, 3),
        courseTypes: courseTypeData,
        credits: creditData,
        dayOfWeek: dayOfWeekData
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, stats })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '분석 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI_강의_분석_보고서_${targetName.replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch('/api/classes');
        if (!res.ok) {
          throw new Error('데이터를 불러오는 중 오류가 발생했습니다.');
        }
        const data = await res.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Build College -> Department hierarchy
  const hierarchy = useMemo(() => {
    const tree: Record<string, Set<string>> = {};
    courses.forEach((c) => {
      let col = c['대학(원)'] || '기타';
      if (col === '단과대구분없음') {
        col = '동북아국제통상물류학부';
      } else if (col === '단과대구분없음(법학)') {
        col = '법학부';
      }
      const dept = c['학과(부)'] || '기타';
      if (!tree[col]) {
        tree[col] = new Set();
      }
      tree[col].add(dept);
    });

    const sortedTree: Record<string, string[]> = {};
    const collegeOrder = [
      '인문대학',
      '자연과학대학',
      '사회과학대학',
      '글로벌정경대학',
      '공과대학',
      '정보기술대학',
      '경영대학',
      '예술체육대학',
      '사범대학',
      '도시과학대학',
      '생명과학기술대학',
      '융합자유전공대학',
      '동북아국제통상물류학부',
      '법학부'
    ];

    collegeOrder.forEach((col) => {
      if (tree[col]) {
        sortedTree[col] = Array.from(tree[col]).sort();
      }
    });
    return sortedTree;
  }, [courses]);



  // Filtered courses based on sidebar selection
  const filteredByNav = useMemo(() => {
    return courses.filter((c) => {
      let col = c['대학(원)'] || '기타';
      if (col === '단과대구분없음') {
        col = '동북아국제통상물류학부';
      } else if (col === '단과대구분없음(법학)') {
        col = '법학부';
      }

      if (selectedCollege && col !== selectedCollege) {
        return false;
      }
      if (selectedDept && (c['학과(부)'] || '기타') !== selectedDept) {
        return false;
      }
      return true;
    });
  }, [courses, selectedCollege, selectedDept]);

  // Final filtered courses (including search bar)
  const finalCourses = useMemo(() => {
    if (!searchQuery.trim()) return filteredByNav;
    const query = searchQuery.toLowerCase();
    return filteredByNav.filter((c) => {
      return (
        c['교과목명']?.toLowerCase().includes(query) ||
        c['담당교수']?.toLowerCase().includes(query) ||
        c['학수번호']?.toLowerCase().includes(query) ||
        c['학과(부)']?.toLowerCase().includes(query)
      );
    });
  }, [filteredByNav, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollege, selectedDept, searchQuery]);

  const totalPages = Math.ceil(finalCourses.length / itemsPerPage);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return finalCourses.slice(start, end);
  }, [finalCourses, currentPage, itemsPerPage]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCourses = filteredByNav.length;
    let totalEnrolled = 0;
    let totalCapacity = 0;
    let originalLanguageCount = 0;

    filteredByNav.forEach((c) => {
      const enrolled = parseInt(c['수강']) || 0;
      const capacity = parseInt(c['정원']) || 0;
      totalEnrolled += enrolled;
      totalCapacity += capacity;

      if (c['원어강의'] && c['원어강의'] !== 'N') {
        originalLanguageCount++;
      }
    });

    const enrollmentRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    const originalLangRatio = totalCourses > 0 ? (originalLanguageCount / totalCourses) * 100 : 0;

    return {
      totalCourses,
      totalEnrolled,
      enrollmentRate: enrollmentRate.toFixed(1),
      originalLangRatio: originalLangRatio.toFixed(1)
    };
  }, [filteredByNav]);

  // Animated KPI values
  const animatedTotalCourses = useCountUp(kpis.totalCourses);
  const animatedTotalEnrolled = useCountUp(kpis.totalEnrolled);
  const animatedEnrollmentRate = useCountUp(parseFloat(kpis.enrollmentRate), 1200, 1);
  const animatedOriginalLangRatio = useCountUp(parseFloat(kpis.originalLangRatio), 1200, 1);

  // Chart 1: 이수구분별 강좌 수
  const categoryCountsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByNav.forEach((c) => {
      const cat = c['이수구분'] || '기타';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // Show top 7
  }, [filteredByNav]);

  // Chart 2: 이수구분별 평균 수강인원
  const categoryAvgEnrolledData = useMemo(() => {
    const sum: Record<string, number> = {};
    const count: Record<string, number> = {};
    
    filteredByNav.forEach((c) => {
      const cat = c['이수구분'] || '기타';
      const enrolled = parseInt(c['수강']) || 0;
      sum[cat] = (sum[cat] || 0) + enrolled;
      count[cat] = (count[cat] || 0) + 1;
    });

    return Object.entries(count)
      .map(([name, totalClasses]) => {
        const average = sum[name] / totalClasses;
        return { name, value: Math.round(average * 10) / 10 };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filteredByNav]);

  // Chart 3: 수업방법 유형 분포
  const courseTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByNav.forEach((c) => {
      const type = c['수업방법'] || '대면수업'; // default to 대면수업 if null
      counts[type] = (counts[type] || 0) + 1;
    });

    const total = filteredByNav.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredByNav]);

  // Chart 4: 학점 구성 비율
  const creditData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByNav.forEach((c) => {
      const cred = c['학점'] ? `${c['학점']}학점` : '0학점';
      counts[cred] = (counts[cred] || 0) + 1;
    });

    const total = filteredByNav.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [filteredByNav]);

  // Chart 5: 요일별 수업 강좌 수
  const dayOfWeekData = useMemo(() => {
    const counts: Record<string, number> = {
      '월요일': 0,
      '화요일': 0,
      '수요일': 0,
      '목요일': 0,
      '금요일': 0,
      '토요일': 0,
      '일요일': 0
    };
    
    filteredByNav.forEach((c) => {
      const kyosi = c['시간표(교시)'] || '';
      if (kyosi.includes('월')) counts['월요일']++;
      if (kyosi.includes('화')) counts['화요일']++;
      if (kyosi.includes('수')) counts['수요일']++;
      if (kyosi.includes('목')) counts['목요일']++;
      if (kyosi.includes('금')) counts['금요일']++;
      if (kyosi.includes('토')) counts['토요일']++;
      if (kyosi.includes('일')) counts['일요일']++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredByNav]);

  // Chart 6: 수업 시간별 강좌 수
  const classTimeData = useMemo(() => {
    const counts: Record<string, number> = {
      '09시': 0,
      '10시': 0,
      '11시': 0,
      '12시': 0,
      '13시': 0,
      '14시': 0,
      '15시': 0,
      '16시': 0,
      '17시': 0,
      '18시 이후': 0
    };

    filteredByNav.forEach((c) => {
      const sigan = c['시간표(시간)'];
      if (sigan) {
        const matches = sigan.match(/\d{2}:\d{2}/g);
        if (matches) {
          // Take start times (even indices)
          for (let i = 0; i < matches.length; i += 2) {
            const startTime = matches[i];
            const hour = parseInt(startTime.split(':')[0]);
            if (hour === 9) counts['09시']++;
            else if (hour === 10) counts['10시']++;
            else if (hour === 11) counts['11시']++;
            else if (hour === 12) counts['12시']++;
            else if (hour === 13) counts['13시']++;
            else if (hour === 14) counts['14시']++;
            else if (hour === 15) counts['15시']++;
            else if (hour === 16) counts['16시']++;
            else if (hour === 17) counts['17시']++;
            else if (hour >= 18) counts['18시 이후']++;
          }
        }
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredByNav]);

  // Dynamic AI Insight Text Generation
  const aiInsights = useMemo(() => {
    const targetName = selectedDept
      ? `${selectedCollege} ${selectedDept}`
      : selectedCollege
      ? selectedCollege
      : '인천대학교 전체 교과목';

    const topCategory = categoryCountsData[0]?.name || '없음';
    const topCategoryCount = categoryCountsData[0]?.value || 0;
    const topCategoryPercent = kpis.totalCourses > 0 ? ((topCategoryCount / kpis.totalCourses) * 100).toFixed(1) : '0';

    return {
      title: `${targetName} AI 교육과정 심층 분석`,
      summary: `2026학년도 1학기 ${targetName}의 교육과정 분석 결과, 총 ${kpis.totalCourses.toLocaleString()}개의 강좌가 개설되어 총 ${kpis.totalEnrolled.toLocaleString()}명의 수강생이 참여하고 있습니다. 평균 수강률은 ${kpis.enrollmentRate}%로 매우 높은 안정성을 유지하고 있습니다.`,
      points: [
        {
          title: '이수구분별 교육 집중도',
          desc: `현재 교육과정은 '${topCategory}' 영역에 집중되어 있으며 (총 ${topCategoryCount}개 강좌, 약 ${topCategoryPercent}%), 전공 전문성 교육에 강한 비중을 보이고 있습니다.`
        },
        {
          title: '글로벌 경쟁력 (원어 강의)',
          desc: `원어(외국어) 진행 강의 비중은 약 ${kpis.originalLangRatio}% 수준입니다. ${parseFloat(kpis.originalLangRatio) > 12 ? '대학 국제화 지표에 부합하는 활발한 글로벌 강좌 개설이 이루어지고 있습니다.' : '글로벌 역량 강화를 위해 전공 및 교양 영역 내 원어 강좌 비중을 확대할 여지가 있습니다.'}`
        },
        {
          title: '강의 형태 및 수강 인원 효율성',
          desc: `강좌당 평균 수강생 수는 약 ${kpis.totalCourses > 0 ? Math.round(kpis.totalEnrolled / kpis.totalCourses) : 0}명으로 적정 수준을 유지하고 있어, 교수자와 학생 간의 원활한 상호작용 및 실습 환경 확보가 용이할 것으로 진단됩니다.`
        }
      ]
    };
  }, [selectedCollege, selectedDept, kpis, categoryCountsData]);

  // Color Palettes
  const PIE_COLORS = ['#01499a', '#fcaf16', '#3b82f6', '#f59e0b', '#10b981', '#64748b'];

  if (loading) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        {/* Skeleton Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white dark:bg-[#1e293b] border-r border-slate-100 dark:border-slate-800 flex-col shrink-0">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-3 w-28 mt-2" />
          </div>
          <div className="flex-1 px-4 py-4 space-y-2">
            <div className="skeleton h-3 w-16 mb-3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-full" style={{ opacity: 1 - i * 0.07 }} />
            ))}
          </div>
        </aside>

        {/* Skeleton Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Skeleton Header */}
          <header className="bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-7 w-56" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-64 rounded-xl" />
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </header>

          {/* Skeleton Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
            {/* Skeleton KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-7 w-24" />
                  </div>
                  <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
                </div>
              ))}
            </div>

            {/* Skeleton Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 h-[320px] flex flex-col">
                  <div className="skeleton h-4 w-40 mb-4" />
                  <div className="flex-1 flex items-end gap-2 pb-4">
                    {i < 2 ? (
                      // Bar chart skeleton
                      Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="flex-1 flex flex-col justify-end h-full">
                          <div className="skeleton w-full rounded-t-md" style={{ height: `${30 + Math.random() * 60}%` }} />
                        </div>
                      ))
                    ) : (
                      // Pie chart skeleton
                      <div className="flex-1 flex items-center justify-center">
                        <div className="skeleton h-36 w-36 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Skeleton Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-24" />
              </div>
              {/* Table header skeleton */}
              <div className="px-6 py-3 bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-6">
                  {[60, 120, 60, 80, 60, 40, 40, 100].map((w, i) => (
                    <div key={i} className="skeleton h-3" style={{ width: w }} />
                  ))}
                </div>
              </div>
              {/* Table rows skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-slate-100/60 dark:border-slate-800/40 flex gap-6" style={{ opacity: 1 - i * 0.08 }}>
                  {[60, 120, 60, 80, 60, 40, 40, 100].map((w, j) => (
                    <div key={j} className="skeleton h-4" style={{ width: w }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl border border-red-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
            <X className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight tracking-tight">
            Incheon National Univ.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            title="테마 변경"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#1e293b] border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Incheon National<br />University
          </h2>
          <p className="text-xs text-inu-blue dark:text-inu-yellow font-semibold mt-1">2026-1 Course Dashboard</p>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {/* 대학 Header */}
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">대학</span>
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="border-b border-slate-200 dark:border-slate-800 mx-4 mb-4" />

          {/* 대학전체 */}
          <button
            onClick={() => {
              setSelectedCollege(null);
              setSelectedDept(null);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-2 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
              !selectedCollege
                ? 'bg-inu-blue/10 text-inu-blue dark:bg-inu-blue/25 dark:text-inu-yellow font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 ${!selectedCollege ? 'bg-inu-blue dark:bg-inu-yellow' : 'bg-slate-300 dark:bg-slate-700'}`} />
            <span>대학전체</span>
          </button>

          {/* 기초교육원 */}
          <a
            href="https://liberaledu.inu.ac.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-left text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
          >
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2.5 shrink-0" />
              <span>기초교육원</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </a>

          {/* Colleges list */}
          <div className="space-y-1">
            {Object.entries(hierarchy).map(([college, depts]) => {
              const isCollegeSelected = selectedCollege === college;
              const isExpanded = !!expandedColleges[college];

              return (
                <div key={college} className="space-y-0.5">
                  <div className="flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150">
                    <button
                      onClick={() => {
                        setSelectedCollege(college);
                        setSelectedDept(null);
                      }}
                      className={`flex-1 flex items-center px-4 py-2 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        isCollegeSelected && !selectedDept
                          ? 'text-inu-blue dark:text-inu-yellow font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 ${isCollegeSelected ? 'bg-inu-blue dark:bg-inu-yellow' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="truncate">{college}</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollege(college);
                      }}
                      className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={isExpanded ? "접기" : "펼치기"}
                    >
                      {isExpanded ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Departments (소속 학과) are shown if isExpanded */}
                  {isExpanded && (
                    <div className="pl-6 space-y-0.5 ml-2 py-0.5 border-l border-slate-100 dark:border-slate-800">
                      {depts.map((dept) => {
                        const isDeptSelected = selectedCollege === college && selectedDept === dept;
                        return (
                          <button
                            key={dept}
                            onClick={() => {
                              setSelectedCollege(college);
                              setSelectedDept(dept);
                              setSidebarOpen(false); // close sidebar on mobile
                            }}
                            className={`w-full flex items-center px-4 py-1.5 rounded-lg text-left text-xs transition-all duration-150 cursor-pointer ${
                              isDeptSelected
                                ? 'bg-inu-blue/10 text-inu-blue dark:bg-inu-blue/20 dark:text-inu-yellow font-bold'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full mr-2 shrink-0 ${isDeptSelected ? 'bg-inu-blue dark:bg-inu-yellow' : 'bg-slate-300/60 dark:bg-slate-700/60'}`} />
                            <span className="truncate">{dept}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        {/* Top Header/Action Bar */}
        <header className="bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-800 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 transition-colors duration-200">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium select-none">
              <button 
                onClick={() => { setSelectedCollege(null); setSelectedDept(null); }}
                className="flex items-center gap-1 hover:text-inu-blue dark:hover:text-inu-yellow transition-colors py-1 cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>홈</span>
              </button>
              <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 shrink-0" />
              <button 
                onClick={() => { setSelectedCollege(null); setSelectedDept(null); }}
                className="hover:text-inu-blue dark:hover:text-inu-yellow transition-colors py-1 cursor-pointer"
              >
                대시보드
              </button>
              {selectedCollege && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 shrink-0" />
                  <button 
                    onClick={() => setSelectedDept(null)}
                    className={`hover:text-inu-blue dark:hover:text-inu-yellow transition-colors py-1 cursor-pointer ${!selectedDept ? 'text-inu-blue dark:text-inu-yellow font-semibold' : ''}`}
                  >
                    {selectedCollege}
                  </button>
                </>
              )}
              {selectedDept && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 shrink-0" />
                  <span className="text-inu-blue dark:text-inu-yellow font-semibold py-1">{selectedDept}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
              전체 교과목 대시보드
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedCollege ? (selectedDept ? `${selectedCollege} > ${selectedDept}` : selectedCollege) : '전체'} |{' '}
              <span className="font-semibold text-inu-blue dark:text-inu-yellow">{kpis.totalCourses.toLocaleString()}</span>개 강좌
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="과목명, 교수명, 학수번호 검색..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-inu-blue/20 focus:border-inu-blue transition-all duration-200 bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Desktop Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer"
              title="테마 변경"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setAiDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-inu-blue via-blue-600 to-inu-yellow text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-inu-blue/20 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>AI 강의 분석</span>
            </button>
          </div>
        </header>

        {/* FILTER TAG CHIPS */}
        {(selectedCollege || searchQuery.trim()) && (
          <div className="bg-white/60 dark:bg-[#1e293b]/60 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 px-8 py-2.5 flex items-center gap-2 flex-wrap shrink-0 transition-colors duration-200">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mr-1 select-none">필터</span>

            {selectedCollege && (
              <button
                onClick={() => { setSelectedCollege(null); setSelectedDept(null); }}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-inu-blue/10 dark:bg-inu-blue/20 border border-inu-blue/20 dark:border-inu-blue/40 text-xs font-semibold text-inu-blue dark:text-blue-300 hover:bg-inu-blue/20 dark:hover:bg-inu-blue/30 transition-all duration-150 cursor-pointer"
              >
                <BookMarked className="h-3 w-3 opacity-60" />
                {selectedCollege}
                <X className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {selectedDept && (
              <button
                onClick={() => setSelectedDept(null)}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-all duration-150 cursor-pointer"
              >
                <Users className="h-3 w-3 opacity-60" />
                {selectedDept}
                <X className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-inu-yellow/10 dark:bg-inu-yellow/20 border border-inu-yellow/20 dark:border-inu-yellow/45 text-xs font-semibold text-inu-yellow dark:text-inu-yellow hover:bg-inu-yellow/20 dark:hover:bg-inu-yellow/30 transition-all duration-150 cursor-pointer"
              >
                <Search className="h-3 w-3 opacity-60" />
                &ldquo;{searchQuery}&rdquo;
                <X className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {/* Show "clear all" only when 2+ filters are active */}
            {((selectedCollege ? 1 : 0) + (selectedDept ? 1 : 0) + (searchQuery.trim() ? 1 : 0)) >= 2 && (
              <button
                onClick={() => { setSelectedCollege(null); setSelectedDept(null); setSearchQuery(''); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 cursor-pointer ml-1"
              >
                <RefreshCw className="h-3 w-3" />
                모두 초기화
              </button>
            )}
          </div>
        )}

        {/* Dashboard Grid and Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">총 강좌 수</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {animatedTotalCourses}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-inu-blue/10 dark:bg-inu-blue/20 flex items-center justify-center text-inu-blue dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">총 수강인원</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {animatedTotalEnrolled}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-inu-yellow/10 dark:bg-inu-yellow/20 flex items-center justify-center text-inu-yellow dark:text-inu-yellow">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">평균 수강률</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{animatedEnrollmentRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <Percent className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">원어강의 비율</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{animatedOriginalLangRatio}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-450">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 1: 이수구분별 강좌 수 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-inu-blue" />
                이수구분별 강좌 수
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryCountsData}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip
                      position={{ y: 0 }}
                      contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#1e293b' }}
                      itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                    />
                    <Bar dataKey="value" fill="url(#inuBlueGrad)" radius={[0, 4, 4, 0]} barSize={16}>
                      <defs>
                        <linearGradient id="inuBlueGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#01499a" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: 이수구분별 평균 수강인원 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-inu-yellow" />
                이수구분별 평균 수강인원
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryAvgEnrolledData}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip
                      position={{ y: 0 }}
                      contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#1e293b' }}
                      itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                    />
                    <Bar dataKey="value" fill="url(#inuYellowGrad)" radius={[0, 4, 4, 0]} barSize={16}>
                      <defs>
                        <linearGradient id="inuYellowGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="100%" stopColor="#fcaf16" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: 수업방법 유형 분포 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-inu-blue" />
                수업방법 유형 분포
              </h3>
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between min-h-0">
                <div className="flex-1 w-full h-[180px] sm:h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={courseTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke={darkMode ? '#1e293b' : '#ffffff'}
                        strokeWidth={2}
                      >
                        {courseTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        position={{ x: 0, y: 0 }}
                        contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-56 overflow-y-auto max-h-[180px] pr-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {courseTypeData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 pl-2">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: 학점 구성 비율 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-inu-yellow" />
                학점 구성 비율
              </h3>
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between min-h-0">
                <div className="flex-1 w-full h-[180px] sm:h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={creditData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke={darkMode ? '#1e293b' : '#ffffff'}
                        strokeWidth={2}
                      >
                        {creditData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        position={{ x: 0, y: 0 }}
                        contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-56 overflow-y-auto max-h-[180px] pr-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {creditData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[(index + 2) % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 pl-2">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS GRID ROW 3 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 5: 요일별 수업 강좌 수 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                요일별 수업 강좌 수
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dayOfWeekData}
                    margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      position={{ y: 0 }}
                      contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#1e293b' }}
                      itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                    />
                    <Bar dataKey="value" fill="url(#roseGrad)" radius={[4, 4, 0, 0]} barSize={24}>
                      <defs>
                        <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fda4af" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 6: 수업 시간별 강좌 수 */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                수업 시간별 강좌 수
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classTimeData}
                    margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      position={{ y: 0 }}
                      contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#1e293b' }}
                      itemStyle={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                    />
                    <Bar dataKey="value" fill="url(#cyanGrad)" radius={[4, 4, 0, 0]} barSize={20}>
                      <defs>
                        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#67e8f9" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 대학(원)별 강좌 분석 요약 */}
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-inu-blue dark:text-inu-yellow animate-pulse" />
              대학(원)별 강좌 분석 요약
            </h3>
            <div className="p-5 rounded-2xl bg-gradient-to-r from-inu-blue/5 via-blue-500/5 to-inu-yellow/5 dark:from-inu-blue/10 dark:via-blue-950/10 dark:to-inu-yellow/10 border border-inu-blue/20 dark:border-inu-blue/40">
              <h4 className="text-sm font-extrabold text-inu-blue dark:text-blue-250 mb-2">{aiInsights.title}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">{aiInsights.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiInsights.points.map((point, idx) => (
                  <div key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-inu-blue/10 dark:border-inu-blue/30 shadow-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-inu-blue/10 dark:bg-inu-blue/20 flex items-center justify-center text-xs font-bold text-inu-blue dark:text-inu-yellow">
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{point.title}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-7">{point.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COURSE LIST TABLE */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Filter className="h-4 w-4 text-inu-blue dark:text-inu-yellow" />
                상세 교과목 조회
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                검색 결과: <span className="text-inu-blue dark:text-inu-yellow font-bold">{finalCourses.length}</span>개 강좌
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">학수번호</th>
                    <th className="px-6 py-3.5">교과목명</th>
                    <th className="px-6 py-3.5">이수구분</th>
                    <th className="px-6 py-3.5">학과(부)</th>
                    <th className="px-6 py-3.5">담당교수</th>
                    <th className="px-6 py-3.5 text-center">정원</th>
                    <th className="px-6 py-3.5 text-center">수강생</th>
                    <th className="px-6 py-3.5">강의실 및 시간표</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {paginatedCourses.map((c) => {
                    const enrolled = parseInt(c['수강']) || 0;
                    const capacity = parseInt(c['정원']) || 0;
                    const isFull = capacity > 0 && enrolled >= capacity;

                    return (
                      <tr key={c.학수번호 + c.담당교수} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-100">
                        <td className="px-6 py-4 font-mono font-medium text-slate-500 dark:text-slate-400">{c.학수번호}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{c.교과목명}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              c.이수구분.includes('전공')
                                ? 'bg-inu-blue/10 dark:bg-inu-blue/20 text-inu-blue dark:text-blue-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {c.이수구분}
                          </span>
                        </td>
                        <td className="px-6 py-4">{c['학과(부)']}</td>
                        <td className="px-6 py-4 font-semibold">{c.담당교수 || '미지정'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400">{c.정원}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${isFull ? 'text-red-500' : 'text-inu-blue dark:text-inu-yellow'}`}>
                            {c.수강}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <div className="truncate font-medium text-slate-600 dark:text-slate-350" title={c.강의실}>
                            {c.강의실 || '미지정'}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={c['시간표(시간)']}>
                            {c['시간표(시간)'] || '시간표 정보 없음'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {finalCourses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                        조건에 부합하는 개설 강좌가 존재하지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  전체 {finalCourses.length}개 중 {(currentPage - 1) * itemsPerPage + 1}~{Math.min(currentPage * itemsPerPage, finalCourses.length)}번째 강좌 표시 중
                </span>
                
                <div className="flex items-center gap-1 select-none">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    이전
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg border text-center transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-inu-blue border-inu-blue text-white shadow-sm font-bold'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <footer className="mt-12 pt-6 pb-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">인천대학교 교과목 대시보드</span>
              <span>|</span>
              <span>개발자: <span className="font-bold text-inu-blue dark:text-inu-yellow">이현 (학번: 202001963)</span></span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="https://www.inu.ac.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-inu-blue dark:hover:text-inu-yellow hover:underline transition-colors"
              >
                인천대학교 홈페이지
              </a>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <a
                href="https://portal.inu.ac.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-inu-blue dark:hover:text-inu-yellow hover:underline transition-colors"
              >
                INU 포털
              </a>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <a
                href="https://cyber.inu.ac.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-inu-blue dark:hover:text-inu-yellow hover:underline transition-colors"
              >
                이러닝
              </a>
            </div>
          </footer>
        </div>
      </main>

      {/* AI INSIGHTS DRAWER */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setAiDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white dark:bg-[#1e293b] h-full shadow-2xl flex flex-col z-10 animate-slide-in border-l border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-inu-blue/5 to-inu-yellow/5 dark:from-inu-blue/15 dark:to-inu-yellow/15">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-inu-blue dark:text-inu-yellow animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI 교육과정 종합 진단</span>
              </div>
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="bg-gradient-to-r from-inu-blue to-[#003875] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                  <Sparkles className="h-40 w-40" />
                </div>
                <h4 className="text-sm font-bold tracking-wide opacity-90">DIAGNOSIS REPORT</h4>
                <h3 className="text-lg font-black tracking-tight mt-1">{aiInsights.title}</h3>
                <p className="text-xs opacity-80 mt-3 leading-relaxed font-medium">
                  {aiInsights.summary}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">주요 인사이트</h4>

                {aiInsights.points.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-inu-blue/10 dark:bg-inu-blue/20 flex items-center justify-center text-xs font-bold text-inu-blue dark:text-inu-yellow shrink-0">
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{point.title}</h5>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">{point.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 dark:bg-slate-800/25 space-y-3">
              <button
                onClick={handleGenerateAIReport}
                disabled={isGeneratingAI}
                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gradient-to-r from-inu-blue to-[#003875] text-white text-sm font-bold shadow-md hover:shadow-lg hover:opacity-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-white"></div>
                    보고서 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    맞춤형 AI 분석 보고서 다운로드
                  </>
                )}
              </button>

              <a
                href="/AI_Analysis_Example.md"
                download="AI_강의_데이터_종합_분석_예시.md"
                className="w-full flex justify-center items-center py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all duration-200"
              >
                예시 보고서 다운로드 (.md)
              </a>

              <button
                onClick={() => setAiDrawerOpen(false)}
                className="w-full flex justify-center items-center py-2.5 rounded-xl bg-slate-200/50 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all duration-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
