import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Upload,
  Plus,
  X,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Users,
  Gift,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  Bar,
} from "recharts";
import { useTheme } from "../components/ThemeContext";
import { Card, Header } from "../components/SharedComponents";
import { LayoutWrapper } from "./DashboardHome";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // ⭐ ADD THIS LINE
import { createPortal } from "react-dom";

export function Portal({ children }) {
  return createPortal(children, document.body);
}

const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};
const CausalAnalysis = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [forecastPayload, setForecastPayload] = useState(null);
  const [scenarioGraph, setScenarioGraph] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [timeView, setTimeView] = useState("monthly");
  const [causalEvents, setCausalEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [storeAnalytics, setStoreAnalytics] = useState(null);
  const [reports, setReports] = useState(null);
  const [causalFactorAnalysis, setCausalFactorAnalysis] = useState(null); // external factors, promo impact
  const [fullReports, setFullReports] = useState(null); // monthly/weekly/yearly reports, bottle size, categories
  const [decisionSupport, setDecisionSupport] = useState(null);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [categoryAnalysis, setCategoryAnalysis] = useState(null);
  const [storeDemandCauses, setStoreDemandCauses] = useState(null);
  const [activeInsightTab, setActiveInsightTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(null);
  const [isRealFile, setIsRealFile] = useState(false);
  const [isLoadingFromFirebase, setIsLoadingFromFirebase] = useState(true);
  const [salesMetrics, setSalesMetrics] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    todayChange: 0,
    weekChange: 0,
    monthChange: 0,
    yearChange: 0,
  });
  const [selectedMetricPeriod, setSelectedMetricPeriod] = useState("month");
  const [salesQueryResult, setSalesQueryResult] = useState(null);
  const [queryType, setQueryType] = useState("date");
  const [queryValue, setQueryValue] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user.uid);
      }
      setIsLoadingFromFirebase(false);
    });

    return () => unsubscribe();
  }, []);

  // Save ONLY analysis data to Firestore (NOT the file)
  const saveToFirestore = async (userId, fileName) => {
    try {
      const userDocRef = doc(db, "userFiles", userId);
      await setDoc(
        userDocRef,
        {
          fileName: fileName,
          uploadedAt: new Date().toISOString(),
          analysisData: {
            scenarioGraph: scenarioGraph,
            forecastPayload: forecastPayload,
            decisions: decisions,
            featureImportance: featureImportance,
            causalEvents: causalEvents,
            storeAnalytics: storeAnalytics,
            causalFactorAnalysis: causalFactorAnalysis,
            fullReports: fullReports,
            decisionSupport: decisionSupport,
            categoryAnalysis: categoryAnalysis,
            storeDemandCauses: storeDemandCauses,
          },
        },
        { merge: true }
      );
      console.log("✓ Data saved to Firestore");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      setError("Failed to save data to cloud storage");
    }
  };

  const loadUserData = async (userId) => {
    try {
      const userDocRef = doc(db, "userFiles", userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("✓ Loading saved data from Firestore");

        // Restore all analysis data
        if (data.analysisData) {
          const analysis = data.analysisData;
          if (analysis.scenarioGraph) setScenarioGraph(analysis.scenarioGraph);
          if (analysis.forecastPayload)
            setForecastPayload(analysis.forecastPayload);
          if (analysis.decisions) setDecisions(analysis.decisions);
          if (analysis.featureImportance)
            setFeatureImportance(analysis.featureImportance);

          // MIGRATE AND LOAD EVENTS - Fixed order
          if (analysis.causalEvents) {
            const migratedEvents = migrateOldEvents(analysis.causalEvents);
            setCausalEvents(migratedEvents);
          }

          if (analysis.storeAnalytics)
            setStoreAnalytics(analysis.storeAnalytics);
          if (analysis.causalFactorAnalysis)
            setCausalFactorAnalysis(analysis.causalFactorAnalysis);
          if (analysis.fullReports) setFullReports(analysis.fullReports);
          if (analysis.decisionSupport)
            setDecisionSupport(analysis.decisionSupport);
          if (analysis.categoryAnalysis)
            setCategoryAnalysis(analysis.categoryAnalysis);
          if (analysis.storeDemandCauses)
            setStoreDemandCauses(analysis.storeDemandCauses);
        }

        // Restore file metadata
        if (data.fileName) {
          // Create a pseudo-file object for display purposes
          const pseudoFile = new File([""], data.fileName, {
            type: "text/csv",
          });
          setFile(pseudoFile);
          setIsRealFile(false); // Mark as pseudo-file
        }

        setUploadStatus("Previous data loaded successfully");
        setTimeout(() => setUploadStatus(""), 3000);
      } else {
        console.log("No saved data found for this user");
      }
    } catch (error) {
      console.error("Error loading from Firestore:", error);
    }
  };

  // Save current state to Firestore with explicit values
  const saveCurrentStateToFirestore = async (
    userId,
    fileName,
    currentState
  ) => {
    try {
      const userDocRef = doc(db, "userFiles", userId);
      await setDoc(
        userDocRef,
        {
          fileName: fileName,
          uploadedAt: new Date().toISOString(),
          analysisData: currentState,
          // ADD THIS - Save all data for Reporting page
          reportingData: {
            fullReports: currentState.fullReports,
            categoryAnalysis: currentState.categoryAnalysis,
            storeAnalytics: currentState.storeAnalytics,
            savedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );
      console.log("✓ Data saved to Firestore");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      setError("Failed to save data to cloud storage");
    }
  };

  const fetchDecisionSupport = async (uploadedFile) => {
    setLoadingDecisions(true);
    try {
      const form = new FormData();
      form.append("file", uploadedFile);

      const res = await fetch("http://127.0.0.1:5000/decision-support", {
        method: "POST",
        body: form,
      });

      if (!res.ok)
        throw new Error((await res.text()) || "Decision support failed");
      const data = await res.json();
      setDecisionSupport(data);

      // ⭐ AUTO-SAVE after fetching
      if (currentUser && file) {
        setTimeout(async () => {
          await saveCurrentStateToFirestore(currentUser.uid, file.name, {
            scenarioGraph,
            forecastPayload,
            decisions,
            featureImportance,
            causalEvents,
            storeAnalytics,
            causalFactorAnalysis,
            fullReports,
            decisionSupport: data, // ⭐ Use fresh data
            categoryAnalysis,
            storeDemandCauses,
          });
        }, 500);
      }

      return data; // ⭐ Return the data
    } catch (err) {
      console.error("Decision support error:", err);
      setError(String(err.message || err));
      return null;
    } finally {
      setLoadingDecisions(false);
    }
  };

  const fetchCategoryAnalysis = async (uploadedFile) => {
    try {
      const form = new FormData();
      form.append("file", uploadedFile);

      const res = await fetch("http://127.0.0.1:5000/category-analysis", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        setCategoryAnalysis(data);

        // ⭐ AUTO-SAVE after fetching
        if (currentUser && file) {
          setTimeout(async () => {
            await saveCurrentStateToFirestore(currentUser.uid, file.name, {
              scenarioGraph,
              forecastPayload,
              decisions,
              featureImportance,
              causalEvents,
              storeAnalytics,
              causalFactorAnalysis,
              fullReports,
              decisionSupport,
              categoryAnalysis: data, // ⭐ Use fresh data
              storeDemandCauses,
            });
          }, 500);
        }

        return data; // ⭐ Return the data
      }
      return null;
    } catch (err) {
      console.error("Category analysis error:", err);
      return null;
    }
  };

  const fetchStoreDemandCauses = async (uploadedFile) => {
    try {
      const form = new FormData();
      form.append("file", uploadedFile);

      const res = await fetch("http://127.0.0.1:5000/store-demand-causes", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        setStoreDemandCauses(data);

        // ⭐ AUTO-SAVE after fetching
        if (currentUser && file) {
          setTimeout(async () => {
            await saveCurrentStateToFirestore(currentUser.uid, file.name, {
              scenarioGraph,
              forecastPayload,
              decisions,
              featureImportance,
              causalEvents,
              storeAnalytics,
              causalFactorAnalysis,
              fullReports,
              decisionSupport,
              categoryAnalysis,
              storeDemandCauses: data, // ⭐ Use fresh data
            });
          }, 500);
        }

        return data; // ⭐ Return the data
      }
      return null;
    } catch (err) {
      console.error("Store demand causes error:", err);
      return null;
    }
  };

  const rerunAIAnalysis = async () => {
    if (!file || !currentUser) {
      setError("Please upload a file first");
      return;
    }

    setIsLoading(true);
    setUploadStatus("Regenerating AI insights...");
    setError("");

    try {
      // ⭐ FIX: Fetch all AI analyses and get the data directly
      const [decisionData, categoryData, storeCausesData] = await Promise.all([
        (async () => {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("http://127.0.0.1:5000/decision-support", {
            method: "POST",
            body: form,
          });
          return res.ok ? await res.json() : null;
        })(),

        (async () => {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("http://127.0.0.1:5000/category-analysis", {
            method: "POST",
            body: form,
          });
          return res.ok ? await res.json() : null;
        })(),

        (async () => {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("http://127.0.0.1:5000/store-demand-causes", {
            method: "POST",
            body: form,
          });
          return res.ok ? await res.json() : null;
        })(),
      ]);

      // ⭐ Update states with new data
      if (decisionData) setDecisionSupport(decisionData);
      if (categoryData) setCategoryAnalysis(categoryData);
      if (storeCausesData) setStoreDemandCauses(storeCausesData);

      // ⭐ Wait a bit for React to update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // ⭐ NOW save with the FRESH data
      await saveCurrentStateToFirestore(currentUser.uid, file.name, {
        scenarioGraph: scenarioGraph,
        forecastPayload: forecastPayload,
        decisions: decisions,
        featureImportance: featureImportance,
        causalEvents: causalEvents,
        storeAnalytics: storeAnalytics,
        causalFactorAnalysis: causalFactorAnalysis,
        fullReports: fullReports,
        decisionSupport: decisionData || decisionSupport, // ⭐ Use fresh data
        categoryAnalysis: categoryData || categoryAnalysis, // ⭐ Use fresh data
        storeDemandCauses: storeCausesData || storeDemandCauses, // ⭐ Use fresh data
      });

      setUploadStatus("✅ AI insights regenerated and saved!");
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err) {
      console.error("Error regenerating AI insights:", err);
      setError("Failed to regenerate AI insights");
    } finally {
      setIsLoading(false);
    }
  };

  const [newEvent, setNewEvent] = useState({
    type: "weather_hot",
    startDate: "",
    endDate: "",
    impact: 25,
    description: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const getForecastPeriodLimits = () => {
    if (!scenarioGraph?.rows?.length) return { minDate: today, maxDate: null };
    const forecastRows = scenarioGraph.rows.filter(
      (row) =>
        row.predicted !== null &&
        row.predicted !== undefined &&
        row.predicted > 0
    );
    if (!forecastRows.length) return { minDate: today, maxDate: null };
    return {
      minDate: forecastRows[0].ds.split("T")[0],
      maxDate: forecastRows[forecastRows.length - 1].ds.split("T")[0],
    };
  };

  const forecastLimits = getForecastPeriodLimits();

  const eventTypes = [
    {
      value: "weather_hot",
      label: "Hot Weather",
      iconName: "Sun",
      color: "#F59E0B",
      impact: 25,
    },
    {
      value: "weather_cold",
      label: "Cold Weather",
      iconName: "Cloud",
      color: "#6B7280",
      impact: -15,
    },
    {
      value: "weather_rainy",
      label: "Rainy Season",
      iconName: "CloudRain",
      color: "#3B82F6",
      impact: -20,
    },
    {
      value: "holiday",
      label: "Holiday/Festival",
      iconName: "Gift",
      color: "#10B981",
      impact: 40,
    },
    {
      value: "event",
      label: "Major Event",
      iconName: "Users",
      color: "#8B5CF6",
      impact: 35,
    },
    {
      value: "other",
      label: "Other Causal Factors",
      iconName: "AlertTriangle",
      color: "#F59E0B",
      impact: 0,
    },
  ];

  // Add this helper function RIGHT AFTER eventTypes
  const getIconComponent = (iconName) => {
    const iconMap = {
      Sun: Sun,
      Cloud: Cloud,
      CloudRain: CloudRain,
      Gift: Gift,
      Users: Users,
      AlertTriangle: AlertTriangle,
    };
    return iconMap[iconName] || AlertTriangle;
  };

  // Add migration function AFTER getIconComponent
  const migrateOldEvents = (events) => {
    if (!events || !Array.isArray(events)) return [];

    return events.map((event) => {
      // If event has 'icon' instead of 'iconName', convert it
      if (event.icon && !event.iconName) {
        // Try to determine iconName from event type
        const eventType = eventTypes.find((t) => t.value === event.type);
        return {
          ...event,
          iconName: eventType?.iconName || "AlertTriangle",
          icon: undefined, // Remove the invalid icon property
        };
      }
      return event;
    });
  };

  // Helper function to show save status
  const showSaveStatus = (message, isError = false) => {
    setUploadStatus(message);
    setTimeout(() => setUploadStatus(""), 2000);
  };

  const fetchStoreAnalytics = async (uploadedFile) => {
    setIsLoading(true);
    setUploadStatus("Fetching store-level analytics...");
    try {
      const form = new FormData();
      form.append("file", uploadedFile);

      const res = await fetch("http://127.0.0.1:5000/store-analytics", {
        method: "POST",
        body: form,
      });
      if (!res.ok)
        throw new Error((await res.text()) || "Store analytics failed");
      const data = await res.json();
      return data; // data should include top buyers, demand patterns, etc.
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
      return null;
    } finally {
      setIsLoading(false);
      setUploadStatus("");
    }
  };

  const fetchReports = async (uploadedFile, period = "monthly") => {
    setIsLoading(true);
    setUploadStatus(`Generating ${period} reports...`);
    try {
      const form = new FormData();
      form.append("file", uploadedFile);
      form.append("period", period);

      const res = await fetch("http://127.0.0.1:5000/reporting", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error((await res.text()) || "Reporting failed");
      const data = await res.json();
      return data; // data should include category/bottle size breakdown, trends, etc.
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
      return null;
    } finally {
      setIsLoading(false);
      setUploadStatus("");
    }
  };

  const runForecastWithEvents = async (uploadedFile, events) => {
    setIsLoading(true);
    setUploadStatus("Processing forecast with events...");
    setError("");

    try {
      const causalForm = new FormData();
      causalForm.append("file", uploadedFile);
      const causalRes = await fetch("http://127.0.0.1:5000/causal-analysis", {
        method: "POST",
        body: causalForm,
      });
      if (!causalRes.ok)
        throw new Error((await causalRes.text()) || "Causal analysis failed");
      const causalData = await causalRes.json();

      if (causalData.causal_factors) {
        setFeatureImportance(
          causalData.causal_factors.map((f) => ({
            feature: f.factor,
            importance: f.correlation,
          }))
        );
      }

      setUploadStatus("Generating 1-year forecast...");
      const forecastForm = new FormData();
      forecastForm.append("file", uploadedFile);
      forecastForm.append("days", "365");
      const forecastRes = await fetch("http://127.0.0.1:5000/forecast", {
        method: "POST",
        body: forecastForm,
      });
      if (!forecastRes.ok)
        throw new Error((await forecastRes.text()) || "Forecast failed");
      const forecastData = await forecastRes.json();

      if (forecastData.graph?.dates && forecastData.graph?.series) {
        const { dates, series } = forecastData.graph;
        const actualSales = series.actual || [];

        const rows = dates.map((date, i) => {
          const baseValue = series.base?.[i];
          const actualValue = actualSales[i];
          const isHistorical =
            actualValue !== null && actualValue !== undefined;
          let totalImpact = 0;
          const eventImpacts = {};

          const validBaseValue =
            baseValue !== null &&
            baseValue !== undefined &&
            !isNaN(baseValue) &&
            baseValue > 0
              ? baseValue
              : null;

          if (!isHistorical && validBaseValue !== null) {
            events.forEach((event) => {
              const currentDate = date.includes("T")
                ? date.split("T")[0]
                : date.substring(0, 10);
              const startDate = event.startDate.includes("T")
                ? event.startDate.split("T")[0]
                : event.startDate;
              const endDate = (event.endDate || event.startDate).includes("T")
                ? (event.endDate || event.startDate).split("T")[0]
                : event.endDate || event.startDate;

              if (currentDate >= startDate && currentDate <= endDate) {
                const impactValue = validBaseValue * (event.impact / 100);
                totalImpact += impactValue;
                eventImpacts[`${event.typeLabel}_${event.id}`] = impactValue;
              }
            });
          }

          return {
            ds: date,
            actual: isHistorical ? actualValue : null,
            baseline:
              !isHistorical && validBaseValue !== null ? validBaseValue : null,
            predicted:
              !isHistorical && validBaseValue !== null
                ? Math.max(0, validBaseValue + totalImpact)
                : null,
            upper:
              !isHistorical && validBaseValue !== null
                ? Math.max(0, (validBaseValue + totalImpact) * 1.15)
                : null,
            lower:
              !isHistorical && validBaseValue !== null
                ? Math.max(0, (validBaseValue + totalImpact) * 0.85)
                : null,
            totalImpact,
            ...eventImpacts,
          };
        });

        const validRows = rows.filter((row) => {
          if (row.actual !== null) return true;
          return row.predicted !== null && row.predicted > 0;
        });

        const allEventKeys = new Set();
        validRows.forEach((row) =>
          Object.keys(row).forEach((key) => {
            if (
              ![
                "ds",
                "actual",
                "baseline",
                "predicted",
                "upper",
                "lower",
                "totalImpact",
              ].includes(key)
            )
              allEventKeys.add(key);
          })
        );

        const newScenarioGraph = {
          rows: validRows,
          seriesNames: ["actual", "baseline", "predicted", "upper", "lower"],
          eventNames: Array.from(allEventKeys),
        };
        setScenarioGraph(newScenarioGraph);

        const newDecisions = forecastData.decisions || [];
        setForecastPayload(forecastData);
        setDecisions(newDecisions);
        setUploadStatus("Analysis complete!");

        // Save to Firestore with the NEW values we just created
        if (currentUser && file) {
          setTimeout(async () => {
            try {
              await saveCurrentStateToFirestore(currentUser.uid, file.name, {
                scenarioGraph: newScenarioGraph,
                forecastPayload: forecastData,
                decisions: newDecisions,
                featureImportance,
                causalEvents,
                storeAnalytics,
                causalFactorAnalysis,
                fullReports,
                decisionSupport,
                categoryAnalysis,
                storeDemandCauses,
              });
            } catch (err) {
              console.error("Error saving analysis to Firestore:", err);
            }
          }, 500);
        }
      }
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(""), 2500);
    }
  };

  // ⭐ ADD THIS NEW FUNCTION - Recalculate event impacts without backend call
  const recalculateEventImpactsClientSide = (baseScenarioGraph, events) => {
    if (!baseScenarioGraph?.rows?.length) return baseScenarioGraph;

    console.log("🔄 Recalculating event impacts client-side...");

    const updatedRows = baseScenarioGraph.rows.map((row) => {
      // Only recalculate for forecast rows (not historical)
      if (row.actual !== null) return row;

      if (row.baseline === null || row.baseline === undefined) return row;

      let totalImpact = 0;
      const eventImpacts = {};

      events.forEach((event) => {
        const currentDate = row.ds.includes("T")
          ? row.ds.split("T")[0]
          : row.ds.substring(0, 10);
        const startDate = event.startDate.includes("T")
          ? event.startDate.split("T")[0]
          : event.startDate;
        const endDate = event.endDate
          ? event.endDate.includes("T")
            ? event.endDate.split("T")[0]
            : event.endDate
          : startDate;

        if (currentDate >= startDate && currentDate <= endDate) {
          const impactValue = row.baseline * (event.impact / 100);
          totalImpact += impactValue;
          eventImpacts[`${event.typeLabel}_${event.id}`] = impactValue;
        }
      });

      return {
        ...row,
        predicted: Math.max(0, row.baseline + totalImpact),
        upper: Math.max(0, (row.baseline + totalImpact) * 1.15),
        lower: Math.max(0, (row.baseline + totalImpact) * 0.85),
        totalImpact,
        ...eventImpacts,
      };
    });

    // Update eventNames
    const allEventKeys = new Set();
    updatedRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (
          ![
            "ds",
            "actual",
            "baseline",
            "predicted",
            "upper",
            "lower",
            "totalImpact",
          ].includes(key)
        ) {
          allEventKeys.add(key);
        }
      });
    });

    return {
      ...baseScenarioGraph,
      rows: updatedRows,
      eventNames: Array.from(allEventKeys),
    };
  };

  const handleFileUploadAndAnalyze = async (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;

    if (!currentUser) {
      setError("Please log in to upload files");
      return;
    }

    setFile(f);
    setIsRealFile(true);

    // ⭐ KEEP EXISTING EVENTS - Don't reset them
    // OLD CODE: setCausalEvents([]);

    // ⭐ Get forecast date range to validate events
    setUploadStatus("Analyzing new file...");

    // Run causal forecast with EXISTING events
    await runForecastWithEvents(f, causalEvents);

    const forecastForm = new FormData();
    forecastForm.append("file", f);

    // Fetch all reports in parallel
    try {
      const results = await Promise.all([
        fetch("http://127.0.0.1:5000/store-analytics", {
          method: "POST",
          body: forecastForm,
        }).then((res) => (res.ok ? res.json() : null)),

        fetch("http://127.0.0.1:5000/causal-factors-report", {
          method: "POST",
          body: forecastForm,
        }).then((res) => (res.ok ? res.json() : null)),

        fetch("http://127.0.0.1:5000/full-reports", {
          method: "POST",
          body: forecastForm,
        }).then((res) => (res.ok ? res.json() : null)),

        fetchDecisionSupport(f).then(() => decisionSupport),
        fetchCategoryAnalysis(f).then(() => categoryAnalysis),
        fetchStoreDemandCauses(f).then(() => storeDemandCauses),
      ]);

      // Set all the states
      if (results[0]) setStoreAnalytics(results[0]);
      if (results[1]) setCausalFactorAnalysis(results[1]);
      if (results[2]) setFullReports(results[2]);

      // ⭐ NEW: Validate and adjust events after getting new data range
      setTimeout(async () => {
        const adjustedEvents = await validateAndAdjustEvents(
          causalEvents,
          scenarioGraph
        );
        setCausalEvents(adjustedEvents);

        // Save with ADJUSTED events (not empty)
        if (currentUser) {
          await saveCurrentStateToFirestore(currentUser.uid, f.name, {
            scenarioGraph: scenarioGraph,
            forecastPayload: forecastPayload,
            decisions: decisions,
            featureImportance: featureImportance,
            causalEvents: adjustedEvents, // ⭐ SAVE ADJUSTED EVENTS
            storeAnalytics: results[0],
            causalFactorAnalysis: results[1],
            fullReports: results[2],
            decisionSupport: decisionSupport,
            categoryAnalysis: categoryAnalysis,
            storeDemandCauses: storeDemandCauses,
          });

          // ⭐ Re-run forecast with adjusted events
          if (adjustedEvents.length > 0) {
            setUploadStatus("Adjusting events to new data range...");
            await runForecastWithEvents(f, adjustedEvents);

            // Save again with updated forecast
            setTimeout(async () => {
              await saveCurrentStateToFirestore(currentUser.uid, f.name, {
                scenarioGraph,
                forecastPayload,
                decisions,
                featureImportance,
                causalEvents: adjustedEvents,
                storeAnalytics: results[0],
                causalFactorAnalysis: results[1],
                fullReports: results[2],
                decisionSupport: decisionSupport,
                categoryAnalysis: categoryAnalysis,
                storeDemandCauses: storeDemandCauses,
              });
            }, 1000);
          }
        }
      }, 2000);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(String(err));
    }
  };

  const validateAndAdjustEvents = async (existingEvents, newScenarioGraph) => {
    if (!existingEvents || existingEvents.length === 0) return [];
    if (!newScenarioGraph?.rows?.length) return existingEvents;

    // Get new forecast date range
    const forecastRows = newScenarioGraph.rows.filter(
      (row) =>
        row.predicted !== null &&
        row.predicted !== undefined &&
        row.predicted > 0
    );

    if (!forecastRows.length) return existingEvents;

    const minDate = new Date(forecastRows[0].ds.split("T")[0]);
    const maxDate = new Date(
      forecastRows[forecastRows.length - 1].ds.split("T")[0]
    );

    console.log(
      `📅 New data range: ${minDate.toISOString().split("T")[0]} to ${
        maxDate.toISOString().split("T")[0]
      }`
    );

    const adjustedEvents = existingEvents.map((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      // Check if event is outside new range
      if (eventStart < minDate || eventStart > maxDate) {
        console.log(
          `⚠️ Event "${event.typeLabel}" is outside new range, adjusting...`
        );

        // Calculate event duration
        const durationDays = Math.ceil(
          (eventEnd - eventStart) / (1000 * 60 * 60 * 24)
        );

        // Move event to start at minDate
        const newStartDate = new Date(minDate);
        const newEndDate = new Date(minDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays);

        // Ensure end date doesn't exceed maxDate
        if (newEndDate > maxDate) {
          newEndDate.setTime(maxDate.getTime());
        }

        return {
          ...event,
          startDate: newStartDate.toISOString().split("T")[0],
          endDate:
            durationDays > 0 ? newEndDate.toISOString().split("T")[0] : "",
        };
      }

      // Event is within range, keep as is
      return event;
    });

    // Show notification of adjustments
    const adjustedCount = adjustedEvents.filter(
      (e, i) => e.startDate !== existingEvents[i].startDate
    ).length;

    if (adjustedCount > 0) {
      setUploadStatus(
        `✅ ${adjustedCount} event(s) adjusted to new data range`
      );
      setTimeout(() => setUploadStatus(""), 3000);
    }

    return adjustedEvents;
  };

  const handleAddEvent = async () => {
    if (!newEvent.startDate) return alert("Please select a start date");

    const { minDate, maxDate } = forecastLimits;
    if (minDate && newEvent.startDate < minDate)
      return alert(`Start date must be on or after ${minDate}`);
    if (maxDate && newEvent.startDate > maxDate)
      return alert(`Start date must be on or before ${maxDate}`);
    if (newEvent.endDate && minDate && newEvent.endDate < minDate)
      return alert(`End date must be on or after ${minDate}`);
    if (newEvent.endDate && maxDate && newEvent.endDate > maxDate)
      return alert(`End date must be on or before ${maxDate}`);

    const newStart = new Date(newEvent.startDate);
    const newEnd = newEvent.endDate ? new Date(newEvent.endDate) : newStart;
    const hasConflict = causalEvents.some((event) => {
      if (event.type !== newEvent.type) return false;
      const existingStart = new Date(event.startDate);
      const existingEnd = event.endDate
        ? new Date(event.endDate)
        : existingStart;
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (hasConflict) {
      const eventType = eventTypes.find((e) => e.value === newEvent.type);
      return alert(
        `Date conflict! This overlaps with another "${eventType.label}" event.`
      );
    }

    const eventType = eventTypes.find((e) => e.value === newEvent.type);
    const updatedEvents = [
      ...causalEvents,
      {
        ...newEvent,
        id: Date.now(),
        typeLabel: eventType.label,
        color: eventType.color,
        iconName: eventType.iconName,
      },
    ];

    // Update state immediately
    setCausalEvents(updatedEvents);
    setShowEventModal(false);
    setNewEvent({
      type: "weather_hot",
      startDate: "",
      endDate: "",
      impact: eventTypes[0].impact,
      description: "",
    });

    if (file && isRealFile) {
      // ⭐ REAL FILE: Run backend forecast
      setUploadStatus("🔄 Updating forecast with new event...");
      await runForecastWithEvents(file, updatedEvents);

      setTimeout(async () => {
        if (currentUser) {
          await saveCurrentStateToFirestore(currentUser.uid, file.name, {
            scenarioGraph,
            forecastPayload,
            decisions,
            featureImportance,
            causalEvents: updatedEvents,
            storeAnalytics,
            causalFactorAnalysis,
            fullReports,
            decisionSupport,
            categoryAnalysis,
            storeDemandCauses,
          });
          setUploadStatus("✅ Event added and forecast updated!");
          setTimeout(() => setUploadStatus(""), 2000);
        }
      }, 1500);
    } else if (file && !isRealFile) {
      // ⭐ PSEUDO-FILE: Recalculate client-side
      setUploadStatus("🔄 Recalculating event impacts...");

      const updatedScenarioGraph = recalculateEventImpactsClientSide(
        scenarioGraph,
        updatedEvents
      );
      setScenarioGraph(updatedScenarioGraph);

      if (currentUser) {
        await saveCurrentStateToFirestore(currentUser.uid, file.name, {
          scenarioGraph: updatedScenarioGraph,
          forecastPayload,
          decisions,
          featureImportance,
          causalEvents: updatedEvents,
          storeAnalytics,
          causalFactorAnalysis,
          fullReports,
          decisionSupport,
          categoryAnalysis,
          storeDemandCauses,
        });
        setUploadStatus("✅ Event added and impacts updated!");
        setTimeout(() => setUploadStatus(""), 2000);
      }
    }
  };

  const handleRemoveEvent = async (id) => {
    const updatedEvents = causalEvents.filter((e) => e.id !== id);
    setCausalEvents(updatedEvents);

    setUploadStatus("💾 Removing event...");

    if (file && isRealFile) {
      // ⭐ REAL FILE: Recalculate with backend
      await runForecastWithEvents(file, updatedEvents);

      setTimeout(async () => {
        if (currentUser) {
          await saveCurrentStateToFirestore(currentUser.uid, file.name, {
            scenarioGraph,
            forecastPayload,
            decisions,
            featureImportance,
            causalEvents: updatedEvents,
            storeAnalytics,
            causalFactorAnalysis,
            fullReports,
            decisionSupport,
            categoryAnalysis,
            storeDemandCauses,
          });
          setUploadStatus("✅ Event removed and forecast updated!");
          setTimeout(() => setUploadStatus(""), 2000);
        }
      }, 1500);
    } else if (file && !isRealFile) {
      // ⭐ PSEUDO-FILE: Recalculate client-side
      setUploadStatus("🔄 Recalculating impacts...");

      const updatedScenarioGraph = recalculateEventImpactsClientSide(
        scenarioGraph,
        updatedEvents
      );
      setScenarioGraph(updatedScenarioGraph);

      if (currentUser) {
        await saveCurrentStateToFirestore(currentUser.uid, file.name, {
          scenarioGraph: updatedScenarioGraph,
          forecastPayload,
          decisions,
          featureImportance,
          causalEvents: updatedEvents,
          storeAnalytics,
          causalFactorAnalysis,
          fullReports,
          decisionSupport,
          categoryAnalysis,
          storeDemandCauses,
        });
        setUploadStatus("✅ Event removed and impacts updated!");
        setTimeout(() => setUploadStatus(""), 2000);
      }
    }
  };

  const handleSalesQuery = async () => {
    if (!file) {
      setError("Please upload a file first");
      return;
    }

    setIsQuerying(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("query_type", queryType);

      if (queryType === "custom") {
        if (!customStartDate || !customEndDate) {
          setError("Please select both start and end dates");
          setIsQuerying(false);
          return;
        }
        formData.append("start_date", customStartDate);
        formData.append("end_date", customEndDate);
      } else {
        if (!queryValue) {
          setError("Please enter a date/period to query");
          setIsQuerying(false);
          return;
        }
        formData.append("query_value", queryValue);
      }

      const response = await fetch("http://127.0.0.1:5000/sales-query", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Query failed");
      }

      const data = await response.json();
      setSalesQueryResult(data);
    } catch (err) {
      console.error("Sales query error:", err);
      setError(String(err.message || err));
    } finally {
      setIsQuerying(false);
    }
  };
  const calculateSalesMetrics = (data) => {
    if (!data || data.length === 0) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Get week boundaries (last 7 days)
    const weekEnd = new Date(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6); // Last 7 days including today

    // Get month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get year boundaries
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    // Previous periods for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(weekEnd.getDate() - 7);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    // Calculate metrics
    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let yearSales = 0;
    let prevWeekSales = 0;
    let prevMonthSales = 0;
    let prevYearSales = 0;
    let yesterdaySales = 0;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    data.forEach((row) => {
      const rowDate = new Date(row.ds);
      const rowDateStr = row.ds.split("T")[0];
      const value = row.actual || 0;

      // Today
      if (rowDateStr === today) {
        todaySales += value;
      }

      // Yesterday
      if (rowDateStr === yesterdayStr) {
        yesterdaySales += value;
      }

      // This week
      if (rowDate >= weekStart && rowDate <= weekEnd) {
        weekSales += value;
      }

      // Previous week
      if (rowDate >= prevWeekStart && rowDate <= prevWeekEnd) {
        prevWeekSales += value;
      }

      // This month
      if (rowDate >= monthStart && rowDate <= monthEnd) {
        monthSales += value;
      }

      // Previous month
      if (rowDate >= prevMonthStart && rowDate <= prevMonthEnd) {
        prevMonthSales += value;
      }

      // This year
      if (rowDate >= yearStart && rowDate <= yearEnd) {
        yearSales += value;
      }

      // Previous year
      if (rowDate >= prevYearStart && rowDate <= prevYearEnd) {
        prevYearSales += value;
      }
    });

    // Calculate percentage changes
    const todayChange =
      yesterdaySales > 0
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
        : 0;
    const weekChange =
      prevWeekSales > 0
        ? ((weekSales - prevWeekSales) / prevWeekSales) * 100
        : 0;
    const monthChange =
      prevMonthSales > 0
        ? ((monthSales - prevMonthSales) / prevMonthSales) * 100
        : 0;
    const yearChange =
      prevYearSales > 0
        ? ((yearSales - prevYearSales) / prevYearSales) * 100
        : 0;

    setSalesMetrics({
      today: Math.round(todaySales),
      week: Math.round(weekSales),
      month: Math.round(monthSales),
      year: Math.round(yearSales),
      todayChange: todayChange,
      weekChange: weekChange,
      monthChange: monthChange,
      yearChange: yearChange,
    });
  };

  const aggregateData = (data, view) => {
    if (!data?.length || view === "daily") return data || [];
    const grouped = {};

    data.forEach((item) => {
      const date = new Date(item.ds);
      let groupKey, sortKey;

      switch (view) {
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          sortKey = weekStart.toISOString();
          groupKey = `W${Math.ceil(
            weekStart.getDate() / 7
          )} ${weekStart.toLocaleString("default", {
            month: "short",
          })} ${weekStart.getFullYear()}`;
          break;
        case "monthly":
          sortKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          groupKey = `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getFullYear()}`;
          break;
        case "quarterly":
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          sortKey = `${date.getFullYear()}-Q${quarter}`;
          groupKey = `Q${quarter} ${date.getFullYear()}`;
          break;
        case "yearly":
          sortKey = groupKey = `${date.getFullYear()}`;
          break;
        default:
          sortKey = groupKey = item.ds;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ds: groupKey,
          sortKey,
          actual: 0,
          baseline: 0,
          predicted: 0,
          upper: 0,
          lower: 0,
          totalImpact: 0,
          actualCount: 0,
          forecastCount: 0,
        };
        scenarioGraph?.eventNames?.forEach((eventName) => {
          grouped[groupKey][eventName] = 0;
        });
      }

      if (item.actual != null && item.actual > 0) {
        grouped[groupKey].actual += item.actual;
        grouped[groupKey].actualCount += 1;
      }
      if (item.baseline != null && item.baseline > 0) {
        grouped[groupKey].baseline += item.baseline;
        grouped[groupKey].forecastCount += 1;
      }
      if (item.predicted != null && item.predicted > 0)
        grouped[groupKey].predicted += item.predicted;
      grouped[groupKey].upper += item.upper || 0;
      grouped[groupKey].lower += item.lower || 0;
      grouped[groupKey].totalImpact += item.totalImpact || 0;
      scenarioGraph?.eventNames?.forEach((eventName) => {
        if (item[eventName]) grouped[groupKey][eventName] += item[eventName];
      });
    });

    // ⚠️ REMOVE THE ENTIRE calculateSalesMetrics FUNCTION HERE

    return Object.values(grouped)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((g) => {
        const result = { ...g };
        result.actual = result.actualCount > 0 ? result.actual : null;
        result.baseline = result.forecastCount > 0 ? result.baseline : null;
        result.predicted = result.forecastCount > 0 ? result.predicted : null;
        result.upper = result.forecastCount > 0 ? result.upper : null;
        result.lower = result.forecastCount > 0 ? result.lower : null;
        delete result.actualCount;
        delete result.forecastCount;
        delete result.sortKey;
        return result;
      });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl max-w-xs">
        <p className="text-white font-semibold text-xs mb-2">{label}</p>
        <div className="space-y-1">
          {payload.slice(0, 5).map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="text-xs truncate" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {entry.value ? Math.round(entry.value).toLocaleString() : "—"}
              </span>
            </div>
          ))}
          {payload.length > 5 && (
            <p className="text-xs text-gray-400 mt-1">
              +{payload.length - 5} more
            </p>
          )}
        </div>
      </div>
    );
  };

  const displayData = scenarioGraph
    ? aggregateData(scenarioGraph.rows, timeView)
    : [];
  const forecastData = displayData.filter(
    (d) => d.predicted !== null && d.predicted > 0
  );
  const avgPredicted = forecastData.length
    ? Math.round(
        forecastData.reduce((s, f) => s + (f.predicted || 0), 0) /
          forecastData.length
      )
    : 0;
  const eventColors = {};
  causalEvents.forEach((event) => {
    eventColors[`${event.typeLabel}_${event.id}`] = event.color;
  });
  const getChartHeight = () =>
    ({ daily: 350, weekly: 320, monthly: 300, quarterly: 280 }[timeView] ||
    280);

  useEffect(() => {
    if (scenarioGraph?.rows?.length > 0) {
      calculateSalesMetrics(scenarioGraph.rows);
    }
  }, [scenarioGraph]);

  if (isLoadingFromFirebase) {
    return (
      <LayoutWrapper currentPage="causal-analysis" onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your saved data...
            </p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper currentPage="causal-analysis" onNavigate={onNavigate}>
      <div className="pt-24 pb-6">
        <Header
          title="Causal Analysis & Events"
          description="Factor Impact, Event Planning & Advanced Forecasting for Beverage Sales"
          icon={TrendingUp}
          onBack={onBack}
        />
        <main className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-4">
          <div className="space-y-6">
            <div class="grid grid-cols-4 gap-4 mb-4">
              <Card className="p-6 box col-span-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 ">
                  <div>
                    <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
                      Data Upload & Analysis
                    </h2>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Upload historical sales data
                    </p>
                    {/* AI Insights Status Indicator */}
                    {decisionSupport && (
                      <div className="mt-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-green-800 dark:text-green-400 font-medium">
                            ✅ AI insights loaded from previous session
                          </span>
                          <button
                            onClick={rerunAIAnalysis}
                            disabled={isLoading || !file}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🔄 Refresh Insights
                          </button>
                        </div>
                      </div>
                    )}
                    {/* File status with session indicator */}
                    {file && (
                      <div className="mt-2 space-y-1">
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                          Current file: {file.name}
                          {!isRealFile && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                              📁 Previous session (events editable)
                            </span>
                          )}
                        </p>
                        {causalEvents.length > 0 && (
                          <p className="text-center text-xs text-green-600 dark:text-green-400">
                            ✅ {causalEvents.length} event(s) saved - Will be
                            preserved on new upload
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white cursor-pointer transition-all ${
                        isLoading
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: theme.chart }}
                    >
                      <Upload size={18} />
                      <span>{isLoading ? "Processing..." : "Upload"}</span>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt,.tsv"
                        onChange={handleFileUploadAndAnalyze}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {uploadStatus && (
                  <div
                    className="text-sm font-medium"
                    style={{ color: theme.chart }}
                  >
                    {uploadStatus}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {error}
                  </div>
                )}
              </Card>

              <Card className="p-6 box col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Causal Events
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Plan and manage events that impact beverage sales
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    disabled={!file}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white transition-all ${
                      !file
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: theme.chart }}
                    title={
                      !file
                        ? "Upload data first to add events"
                        : "Add a new causal event"
                    }
                  >
                    <Plus size={18} />
                    <span>Add Event</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {causalEvents.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No causal events added yet. Click "Add Event" to start
                      planning.
                    </div>
                  ) : (
                    causalEvents.map((event) => {
                      const Icon = getIconComponent(event.iconName); // Use helper function to get icon
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: event.color + "20" }}
                            >
                              <Icon
                                className="w-5 h-5"
                                style={{ color: event.color }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {event.typeLabel}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.startDate}{" "}
                                {event.endDate && `to ${event.endDate}`} •
                                Impact: {event.impact > 0 ? "+" : ""}
                                {event.impact}%
                              </p>
                              {event.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveEvent(event.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {showEventModal && (
              <Portal>
                <>
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    onClick={() => setShowEventModal(false)}
                  />
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                    <Card className="w-full max-w-lg p-6 relative pointer-events-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Add Causal Event
                        </h3>
                        <button
                          onClick={() => setShowEventModal(false)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Event Type
                          </label>
                          <select
                            value={newEvent.type}
                            onChange={(e) => {
                              const selected = eventTypes.find(
                                (t) => t.value === e.target.value
                              );
                              setNewEvent({
                                ...newEvent,
                                type: e.target.value,
                                impact: selected?.impact || 0,
                              });
                            }}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white"
                          >
                            {eventTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={newEvent.startDate}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  startDate: e.target.value,
                                })
                              }
                              min={forecastLimits.minDate || today}
                              max={forecastLimits.maxDate || undefined}
                              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={newEvent.endDate}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  endDate: e.target.value,
                                })
                              }
                              min={
                                newEvent.startDate ||
                                forecastLimits.minDate ||
                                today
                              }
                              max={forecastLimits.maxDate || undefined}
                              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Impact (%)
                          </label>
                          <input
                            type="number"
                            value={newEvent.impact}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                impact: Number(e.target.value),
                              })
                            }
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="e.g., 25 for +25% or -15 for -15%"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                          </label>
                          <textarea
                            value={newEvent.description}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="Additional notes about this event..."
                          />
                        </div>
                        <button
                          onClick={handleAddEvent}
                          disabled={isLoading}
                          className="w-full py-2 rounded-xl text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                          style={{ backgroundColor: theme.chart }}
                        >
                          {isLoading ? "Adding Event..." : "Add Event"}
                        </button>
                      </div>
                    </Card>
                  </div>
                </>
              </Portal>
            )}

            {/* Row 1: Two Charts Side by Side - FLEXBOX VERSION */}
            {displayData.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-6 mb-6">
                {/* RIGHT: Forecast Event Impact */}
                <div className="flex-1 w-full lg:w-1/2">
                  <Card className="p-6 h-full">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          📈 Forecast Event Impact
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["weekly", "monthly", "quarterly", "yearly"].map(
                          (view) => (
                            <button
                              key={view}
                              onClick={() => setTimeView(view)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                timeView === view
                                  ? "text-white shadow-lg scale-105"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              style={
                                timeView === view
                                  ? { backgroundColor: theme.chart }
                                  : {}
                              }
                            >
                              {view.charAt(0).toUpperCase() + view.slice(1)}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {(() => {
                      const hasEvents = causalEvents.length > 0;
                      const chartData = hasEvents
                        ? forecastData
                        : displayData.filter((d) => d.predicted !== null);

                      return (
                        <>
                          <div style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={chartData}
                                margin={{
                                  top: 5,
                                  right: 5,
                                  left: 0,
                                  bottom: 40,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#4c5b74ff"
                                  opacity={0.1}
                                />
                                <XAxis
                                  dataKey="ds"
                                  stroke="#9CA3AF"
                                  tick={{
                                    fontSize: timeView === "daily" ? 10 : 11,
                                    fill: "#9CA3AF",
                                  }}
                                  interval="preserveStartEnd"
                                  angle={
                                    timeView === "daily"
                                      ? -45
                                      : timeView === "weekly"
                                      ? -30
                                      : 0
                                  }
                                  textAnchor={
                                    timeView === "daily" ||
                                    timeView === "weekly"
                                      ? "end"
                                      : "middle"
                                  }
                                  height={65}
                                  tickFormatter={(value) => {
                                    // DAILY = already ISO dates → display directly
                                    if (timeView === "daily") {
                                      const d = new Date(value);
                                      return d.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      });
                                    }

                                    // WEEKLY
                                    if (timeView === "weekly") {
                                      // If already formatted (e.g., "W3 Apr 2023"), just display it
                                      if (value.startsWith("W")) {
                                        return value;
                                      }
                                      // Handle "2023-W03" format
                                      const [year, week] = value
                                        .split("-W")
                                        .map(Number);
                                      const jan4 = new Date(year, 0, 4);
                                      const monday = new Date(jan4);
                                      monday.setDate(
                                        jan4.getDate() -
                                          ((jan4.getDay() + 6) % 7) +
                                          (week - 1) * 7
                                      );
                                      return monday.toLocaleDateString(
                                        "en-US",
                                        { month: "short", day: "numeric" }
                                      );
                                    }

                                    // MONTHLY
                                    if (
                                      timeView === "monthly" &&
                                      value.includes(" ")
                                    ) {
                                      const [month, year] = value.split(" ");
                                      return `${month} '${year.slice(-2)}`;
                                    }

                                    // QUARTERLY
                                    if (timeView === "quarterly") {
                                      // If already formatted (e.g., "Q1 2024"), just display it
                                      if (value.startsWith("Q")) {
                                        return value;
                                      }
                                      // Handle "2024-Q1" format
                                      const [year, q] = value
                                        .split("-Q")
                                        .map(Number);
                                      return `Q${q} ${year}`;
                                    }

                                    // YEARLY
                                    if (timeView === "yearly") {
                                      return value; // "2024" works as-is
                                    }

                                    return value;
                                  }}
                                />
                                <YAxis
                                  stroke="#9CA3AF"
                                  tick={{ fontSize: 9 }}
                                  width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                {hasEvents ? (
                                  <>
                                    <Bar
                                      dataKey="baseline"
                                      fill="#9CA3AF"
                                      fillOpacity={0.4}
                                      name="Baseline"
                                      radius={[3, 3, 0, 0]}
                                    />
                                    {scenarioGraph?.eventNames?.map(
                                      (eventName, idx) => {
                                        const color =
                                          eventColors[eventName] ||
                                          `hsl(${idx * 60}, 70%, 60%)`;
                                        return (
                                          <Bar
                                            key={eventName}
                                            dataKey={eventName}
                                            stackId="events"
                                            fill={color}
                                            fillOpacity={0.8}
                                            name={eventName
                                              .split("_")
                                              .slice(0, -1)
                                              .join(" ")}
                                            radius={
                                              idx ===
                                              scenarioGraph.eventNames.length -
                                                1
                                                ? [3, 3, 0, 0]
                                                : [0, 0, 0, 0]
                                            }
                                          />
                                        );
                                      }
                                    )}
                                    <Line
                                      type="monotone"
                                      dataKey="predicted"
                                      stroke={theme.chart}
                                      strokeWidth={2}
                                      dot={false}
                                      name="Total"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Bar
                                      dataKey="baseline"
                                      fill="#9CA3AF"
                                      fillOpacity={0.4}
                                      name="Baseline Forecast"
                                      radius={[3, 3, 0, 0]}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="predicted"
                                      stroke={theme.chart}
                                      strokeWidth={2}
                                      dot={false}
                                      name="Predicted"
                                    />
                                  </>
                                )}
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>

                          {hasEvents ? (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {causalEvents.map((event) => {
                                const eventKey = `${event.typeLabel}_${event.id}`;
                                const totalImpact = forecastData.reduce(
                                  (sum, d) => sum + (d[eventKey] || 0),
                                  0
                                );
                                const Icon = getIconComponent(event.iconName);
                                return (
                                  <div
                                    key={event.id}
                                    className="p-2 rounded-lg border"
                                    style={{
                                      backgroundColor: event.color + "10",
                                      borderColor: event.color + "40",
                                    }}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      <Icon
                                        className="w-3 h-3"
                                        style={{ color: event.color }}
                                      />
                                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                        {event.typeLabel}
                                      </span>
                                    </div>
                                    <div
                                      className="text-sm font-bold"
                                      style={{ color: event.color }}
                                    >
                                      {totalImpact > 0 ? "+" : ""}
                                      {Math.round(totalImpact).toLocaleString()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <p className="text-xs text-blue-800 dark:text-blue-400">
                                💡 Showing baseline forecast. Add events above
                                to see their impact on sales.
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* KPI Cards for Forecast */}
                    {forecastPayload && displayData.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                          <div className="text-xs font-medium text-green-800 dark:text-green-400">
                            Avg Sales
                          </div>
                          <div className="text-lg font-bold text-green-900 dark:text-green-300">
                            {avgPredicted.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="text-xs font-medium text-blue-800 dark:text-blue-400">
                            Total Period
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                            {Math.round(
                              forecastData.reduce(
                                (sum, d) => sum + (d.predicted || 0),
                                0
                              )
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                          <div className="text-xs font-medium text-purple-800 dark:text-purple-400">
                            Active Events
                          </div>
                          <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                            {causalEvents.length}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                          <div className="text-xs font-medium text-orange-800 dark:text-orange-400">
                            Total Impact
                          </div>
                          <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
                            {(() => {
                              const totalPredicted = forecastData.reduce(
                                (sum, d) => sum + (d.predicted || 0),
                                0
                              );
                              const totalBaseline = forecastData.reduce(
                                (sum, d) => sum + (d.baseline || 0),
                                0
                              );
                              const impact =
                                totalBaseline > 0
                                  ? ((totalPredicted - totalBaseline) /
                                      totalBaseline) *
                                    100
                                  : 0;
                              return (
                                (impact > 0 ? "+" : "") + impact.toFixed(1)
                              );
                            })()}
                            %
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* LEFT: Historical Sales */}
                <div className="flex-1 w-full lg:w-1/2">
                  <Card className="p-6 h-full">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      📉 Historical Sales
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                      Actual performance trends
                    </p>

                    {displayData.some((d) => d.actual !== null) ? (
                      <>
                        <div style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={displayData.filter(
                                (d) => d.actual !== null
                              )}
                              margin={{ top: 5, right: 5, left: 0, bottom: 40 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                                opacity={0.1}
                              />
                              <XAxis
                                dataKey="ds"
                                stroke="#9CA3AF"
                                tick={{
                                  fontSize: timeView === "daily" ? 10 : 11,
                                  fill: "#9CA3AF",
                                }}
                                interval="preserveStartEnd"
                                angle={
                                  timeView === "daily"
                                    ? -45
                                    : timeView === "weekly"
                                    ? -30
                                    : 0
                                }
                                textAnchor={
                                  timeView === "daily" || timeView === "weekly"
                                    ? "end"
                                    : "middle"
                                }
                                height={65}
                                tickFormatter={(value) => {
                                  // DAILY = already ISO dates → display directly
                                  if (timeView === "daily") {
                                    const d = new Date(value);
                                    return d.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    });
                                  }

                                  // WEEKLY
                                  if (timeView === "weekly") {
                                    // If already formatted (e.g., "W3 Apr 2023"), just display it
                                    if (value.startsWith("W")) {
                                      return value;
                                    }
                                    // Handle "2023-W03" format
                                    const [year, week] = value
                                      .split("-W")
                                      .map(Number);
                                    const jan4 = new Date(year, 0, 4);
                                    const monday = new Date(jan4);
                                    monday.setDate(
                                      jan4.getDate() -
                                        ((jan4.getDay() + 6) % 7) +
                                        (week - 1) * 7
                                    );
                                    return monday.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    });
                                  }

                                  // MONTHLY
                                  if (
                                    timeView === "monthly" &&
                                    value.includes(" ")
                                  ) {
                                    const [month, year] = value.split(" ");
                                    return `${month} '${year.slice(-2)}`;
                                  }

                                  // QUARTERLY
                                  if (timeView === "quarterly") {
                                    // If already formatted (e.g., "Q1 2024"), just display it
                                    if (value.startsWith("Q")) {
                                      return value;
                                    }
                                    // Handle "2024-Q1" format
                                    const [year, q] = value
                                      .split("-Q")
                                      .map(Number);
                                    return `Q${q} ${year}`;
                                  }

                                  // YEARLY
                                  if (timeView === "yearly") {
                                    return value; // "2024" works as-is
                                  }

                                  return value;
                                }}
                              />
                              <YAxis
                                stroke="#9CA3AF"
                                tick={{ fontSize: 9 }}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              {timeView === "daily" || timeView === "weekly" ? (
                                <Bar
                                  dataKey="actual"
                                  fill="#10B981"
                                  fillOpacity={0.8}
                                  name="Actual"
                                  radius={[3, 3, 0, 0]}
                                />
                              ) : (
                                <>
                                  <defs>
                                    <linearGradient
                                      id="colorActual"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="#10B981"
                                        stopOpacity={0.8}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="#10B981"
                                        stopOpacity={0.1}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <Area
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fill="url(#colorActual)"
                                    name="Actual"
                                  />
                                </>
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        {/* KPI Cards for Historical */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {(() => {
                            const historicalData = displayData.filter(
                              (d) => d.actual !== null && d.actual > 0
                            );
                            const totalSales = historicalData.reduce(
                              (sum, d) => sum + d.actual,
                              0
                            );
                            const avgSales =
                              historicalData.length > 0
                                ? totalSales / historicalData.length
                                : 0;
                            const maxSales =
                              historicalData.length > 0
                                ? Math.max(
                                    ...historicalData.map((d) => d.actual)
                                  )
                                : 0;
                            let growthRate = 0;
                            if (historicalData.length >= 2) {
                              const firstHalf = historicalData.slice(
                                0,
                                Math.floor(historicalData.length / 2)
                              );
                              const secondHalf = historicalData.slice(
                                Math.floor(historicalData.length / 2)
                              );
                              const firstAvg =
                                firstHalf.reduce((s, d) => s + d.actual, 0) /
                                firstHalf.length;
                              const secondAvg =
                                secondHalf.reduce((s, d) => s + d.actual, 0) /
                                secondHalf.length;
                              growthRate =
                                firstAvg > 0
                                  ? ((secondAvg - firstAvg) / firstAvg) * 100
                                  : 0;
                            }

                            return (
                              <>
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                                  <div className="text-xs font-medium text-green-800 dark:text-green-400">
                                    Total
                                  </div>
                                  <div className="text-sm font-bold text-green-900 dark:text-green-300">
                                    {Math.round(totalSales).toLocaleString()}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                                  <div className="text-xs font-medium text-blue-800 dark:text-blue-400">
                                    Average
                                  </div>
                                  <div className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                    {Math.round(avgSales).toLocaleString()}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                                  <div className="text-xs font-medium text-purple-800 dark:text-purple-400">
                                    Peak
                                  </div>
                                  <div className="text-sm font-bold text-purple-900 dark:text-purple-300">
                                    {Math.round(maxSales).toLocaleString()}
                                  </div>
                                </div>
                                <div
                                  className={`p-2 rounded-lg border ${
                                    growthRate >= 0
                                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800"
                                      : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800"
                                  }`}
                                >
                                  <div
                                    className={`text-xs font-medium ${
                                      growthRate >= 0
                                        ? "text-emerald-800 dark:text-emerald-400"
                                        : "text-orange-800 dark:text-orange-400"
                                    }`}
                                  >
                                    Growth
                                  </div>
                                  <div
                                    className={`text-sm font-bold ${
                                      growthRate >= 0
                                        ? "text-emerald-900 dark:text-emerald-300"
                                        : "text-orange-900 dark:text-orange-300"
                                    }`}
                                  >
                                    {growthRate > 0 ? "+" : ""}
                                    {growthRate.toFixed(1)}%
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        No historical data available
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* SALES QUERY CARD */}
            <Card className="p-6 box">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  🔍 Sales Query
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search exact sales for specific dates or periods
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Query Type Selector */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { value: "date", label: "Specific Date" },
                      { value: "week", label: "Week" },
                      { value: "month", label: "Month" },
                      { value: "year", label: "Year" },
                      { value: "custom", label: "Custom Range" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setQueryType(type.value);
                          setQueryValue("");
                          setSalesQueryResult(null);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          queryType === type.value
                            ? "text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                        style={
                          queryType === type.value
                            ? { backgroundColor: theme.chart }
                            : {}
                        }
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {/* Query Input */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    {queryType === "date" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={queryValue}
                          onChange={(e) => setQueryValue(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {queryType === "week" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Week (Format: 2023-W10)
                        </label>
                        <input
                          type="week"
                          value={queryValue}
                          onChange={(e) => setQueryValue(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {queryType === "month" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Month (Format: 2023-03)
                        </label>
                        <input
                          type="month"
                          value={queryValue}
                          onChange={(e) => setQueryValue(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {queryType === "year" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Enter Year (e.g., 2023)
                        </label>
                        <input
                          type="number"
                          value={queryValue}
                          onChange={(e) => setQueryValue(e.target.value)}
                          placeholder="2023"
                          min="2000"
                          max="2100"
                          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {queryType === "custom" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={customStartDate}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSalesQuery}
                      disabled={isQuerying || !file}
                      className="w-full mt-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: theme.chart }}
                    >
                      {isQuerying ? "Searching..." : "🔍 Search Sales"}
                    </button>
                  </div>

                  {/* Query Results */}
                  {salesQueryResult && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                      {salesQueryResult.found ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              📊 {salesQueryResult.query_type} Results
                            </h3>
                            <button
                              onClick={() => setSalesQueryResult(null)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                              <div className="text-xs font-medium text-blue-800 dark:text-blue-400">
                                Total Sales
                              </div>
                              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                                {salesQueryResult.total_sales?.toLocaleString()}
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                units
                              </div>
                            </div>

                            {salesQueryResult.average_daily && (
                              <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                                <div className="text-xs font-medium text-green-800 dark:text-green-400">
                                  Avg Daily
                                </div>
                                <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                                  {salesQueryResult.average_daily?.toLocaleString()}
                                </div>
                                <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                                  units/day
                                </div>
                              </div>
                            )}

                            {salesQueryResult.days_count && (
                              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                                <div className="text-xs font-medium text-purple-800 dark:text-purple-400">
                                  Days
                                </div>
                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                                  {salesQueryResult.days_count}
                                </div>
                                <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                                  in period
                                </div>
                              </div>
                            )}

                            {salesQueryResult.day_of_week && (
                              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                                <div className="text-xs font-medium text-orange-800 dark:text-orange-400">
                                  Day
                                </div>
                                <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
                                  {salesQueryResult.day_of_week}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Peak/Lowest Days */}
                          {salesQueryResult.peak_day && (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">
                                  🏆 Peak Day
                                </div>
                                <div className="text-sm font-semibold text-green-900 dark:text-green-300">
                                  {salesQueryResult.peak_day.date}
                                </div>
                                <div className="text-lg font-bold text-green-900 dark:text-green-300">
                                  {salesQueryResult.peak_day.sales.toLocaleString()}{" "}
                                  units
                                </div>
                              </div>

                              {salesQueryResult.lowest_day && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                  <div className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">
                                    📉 Lowest Day
                                  </div>
                                  <div className="text-sm font-semibold text-red-900 dark:text-red-300">
                                    {salesQueryResult.lowest_day.date}
                                  </div>
                                  <div className="text-lg font-bold text-red-900 dark:text-red-300">
                                    {salesQueryResult.lowest_day.sales.toLocaleString()}{" "}
                                    units
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Additional Info */}
                          {salesQueryResult.date_range && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              📅 Period: {salesQueryResult.date_range}
                            </p>
                          )}

                          {salesQueryResult.month_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              📅 Month: {salesQueryResult.month_name}{" "}
                              {salesQueryResult.query_value.split("-")[0]}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                          <p className="text-gray-900 dark:text-white font-semibold">
                            No Data Found
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {salesQueryResult.message ||
                              "No sales data available for this period"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {storeAnalytics && (
              <Card className="p-6 col-span-3 mt-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  📊 Store-Level Analytics
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Top Store Buyers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {storeAnalytics.top_buyers?.length > 6 && (
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          Show {storeAnalytics.top_buyers.length - 6} more
                          stores...
                        </button>
                      )}
                      {storeAnalytics.top_buyers
                        ?.slice(0, 6)
                        .map((store, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
                          >
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-400">
                              #{idx + 1} {store.name}
                            </div>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                              {store.sales.toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                              Total purchases
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Decision Support System - AI-Powered Insights */}
          {decisionSupport && (
            <Card className="p-6 mt-6 mb-6">
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Zap className="w-6 h-6" />
                AI-Powered Decision Support System
              </h2>
              <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                Strategic insights and recommendations powered by{" "}
                {decisionSupport.generated_by}
              </p>
              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Total Sales
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                    {decisionSupport.metrics?.total_sales?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Avg Daily
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                    {decisionSupport.metrics?.avg_daily?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Trend
                  </div>
                  <div
                    className={`text-2xl font-bold mt-1 ${
                      decisionSupport.metrics?.trend >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {decisionSupport.metrics?.trend > 0 ? "+" : ""}
                    {decisionSupport.metrics?.trend?.toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Peak Month
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                    {decisionSupport.metrics?.peak_month || "N/A"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Volatility
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                    {((decisionSupport.metrics?.volatility || 0) * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
              </div>

              {/* Store Performance Metrics */}
              {decisionSupport.metrics?.store_metrics && (
                <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                  <h4 className="text-md font-semibold text-purple-900 dark:text-purple-300 mb-3">
                    Top Store Performance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Top Performer
                      </div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {decisionSupport.metrics.store_metrics.top_store}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Sales
                      </div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {decisionSupport.metrics.store_metrics.top_store_sales?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Stores
                      </div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {decisionSupport.metrics.store_metrics.total_stores}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                <div className="prose prose-purple dark:prose-invert max-w-none">
                  <div className="text-sm leading-relaxed space-y-4">
                    {decisionSupport.insights.split("\n").map((line, idx) => {
                      // Headers
                      if (line.startsWith("# ")) {
                        return (
                          <h2
                            key={idx}
                            className="text-xl font-bold mt-6 mb-3 text-purple-900 dark:text-purple-300"
                          >
                            {line.substring(2)}
                          </h2>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h3
                            key={idx}
                            className="text-lg font-semibold mt-4 mb-2 text-purple-800 dark:text-purple-400"
                          >
                            {line.substring(3)}
                          </h3>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h4
                            key={idx}
                            className="text-md font-medium mt-3 mb-2 text-purple-700 dark:text-purple-500"
                          >
                            {line.substring(4)}
                          </h4>
                        );
                      }
                      // Bullet points
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2 ml-4"
                          >
                            <span className="text-purple-600 dark:text-purple-400 mt-1">
                              •
                            </span>
                            <span className="flex-1 text-gray-700 dark:text-gray-300">
                              {line.substring(2)}
                            </span>
                          </div>
                        );
                      }
                      // Regular paragraphs
                      if (line.trim()) {
                        return (
                          <p
                            key={idx}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Store Demand Causes */}
          {storeDemandCauses &&
            storeDemandCauses.causes &&
            storeDemandCauses.causes.length > 0 && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🏪 Store Demand Analysis & Root Causes
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {storeDemandCauses.causes.map((cause, idx) => {
                    const statusColors = {
                      stopped:
                        "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
                      critical:
                        "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20",
                      warning:
                        "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20",
                      variable:
                        "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
                      good: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
                      stable:
                        "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
                    };
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                          statusColors[cause.status] || statusColors.stable
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {cause.store}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {cause.total_orders} orders
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {cause.cause}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Recent Avg:
                            </span>
                            <span className="font-semibold ml-1">
                              {Math.round(cause.recent_avg).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Overall Avg:
                            </span>
                            <span className="font-semibold ml-1">
                              {Math.round(cause.overall_avg).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Last Order:
                            </span>
                            <span className="font-semibold ml-1">
                              {cause.days_since_last_order}d ago
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          {featureImportance.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Feature Importance
              </h3>
              <div className="space-y-3">
                {featureImportance.slice(0, 8).map((f, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {f.feature}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: theme.chart }}
                      >
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${f.importance * 100}%`,
                          backgroundColor: theme.chart,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default CausalAnalysis;
