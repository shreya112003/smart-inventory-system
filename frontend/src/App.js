import React, { useEffect, useState } from "react";
import "./App.css";

import { Button } from "./components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { Slider } from "./components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { toast } from "./components/ui/sonner";

import {
  TrendingUp,
  Package,
  AlertCircle,
  BarChart3,
  Activity,
  Loader2,
  CheckCircle,
} from "lucide-react";

import axios from "axios";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weeks, setWeeks] = useState([4]);
  const [historicalData, setHistoricalData] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    checkSystemHealth();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) fetchHistoricalData(selectedProduct);
  }, [selectedProduct]);

  const checkSystemHealth = async () => {
    try {
      const res = await axios.get(`${API}/health`);
      setSystemStatus(res.data);
    } catch {
      toast.error("Backend unreachable");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data || []);
      if (res.data && res.data.length > 0) setSelectedProduct(res.data[0].product_id);
    } catch {
      toast.error("Failed to load products");
    }
  };

  const fetchHistoricalData = async (productId) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/historical/${productId}`);
      setHistoricalData(res.data || []);
    } catch {
      toast.error("Unable to load historical data");
      setHistoricalData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/predict`, {
        product_id: selectedProduct,
        weeks: weeks[0],
      });
      setPredictions(res.data);
      toast.success("Forecast generated!");
    } catch {
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const getStockAlert = () => {
    if (!predictions) return { text: "No Data", color: "#888", icon: AlertCircle };
    const avg = predictions.average_predicted_demand;
    if (avg < 100) return { text: "Low", color: "#28a745", icon: CheckCircle };
    if (avg < 200) return { text: "Moderate", color: "#007DC6", icon: Activity };
    if (avg < 300) return { text: "High", color: "#FFC220", icon: TrendingUp };
    return { text: "Very High", color: "#ff6b6b", icon: TrendingUp };
  };

  const stockAlert = getStockAlert();
  const StockIcon = stockAlert.icon;

  return (
    <div className="min-h-screen app-bg">
      <header className="app-header">
        <div className="container header-flex">
          <div>
            <h1 className="header-title">Smart Inventory Forecasting</h1>
            <p className="header-sub">AI-powered demand predictions</p>
          </div>

          <div className="header-status">
            {systemStatus && (
              <span className="status-dot">
                {systemStatus.status === "healthy" ? "System Ready" : "Degraded"}
              </span>
            )}
            <BarChart3 size={34} className="header-icon" />
          </div>
        </div>
      </header>

      <main className="container content-section">
        <Card className="app-card mb-8">
          <CardHeader>
            <CardTitle className="card-title">Forecast Configuration</CardTitle>
            <CardDescription>Select product and forecast duration</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="input-label">Select Product</label>

                <Select value={selectedProduct?.toString()} onValueChange={(v) => setSelectedProduct(parseInt(v))}>
                  <SelectTrigger className="input-select">
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>

                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.product_id} value={p.product_id.toString()}>
                        {p.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="input-label">Forecast: {weeks[0]} weeks</label>
                <Slider value={weeks} onValueChange={setWeeks} min={1} max={12} step={1} />
              </div>

              <div className="flex items-end">
                <Button className="primary-button w-full" disabled={loading} onClick={handlePredict}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" /> Predicting...
                    </>
                  ) : (
                    "Predict Demand"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {predictions && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="metric-card">
              <CardContent className="metric-inner">
                <div>
                  <p className="metric-label">Total Demand</p>
                  <p className="metric-value">{Math.round(predictions.total_predicted_demand)}</p>
                  <p className="metric-sub">over {weeks[0]} weeks</p>
                </div>
                <Package className="metric-icon" size={36} />
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="metric-inner">
                <div>
                  <p className="metric-label">Avg Weekly</p>
                  <p className="metric-value">{Math.round(predictions.average_predicted_demand)}</p>
                  <p className="metric-sub">units</p>
                </div>
                <TrendingUp className="metric-icon" size={36} />
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="metric-inner">
                <div>
                  <p className="metric-label">Peak Demand</p>
                  <p className="metric-value">{predictions.max_predicted_demand}</p>
                  <p className="metric-sub">highest week</p>
                </div>
                <Activity className="metric-icon" size={36} />
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="metric-inner">
                <div>
                  <p className="metric-label">Demand Level</p>
                  <p className="metric-alert" style={{ color: stockAlert.color }}>
                    {stockAlert.text}
                  </p>
                </div>
                <StockIcon size={36} style={{ color: stockAlert.color }} />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="app-card">
            <CardHeader>
              <CardTitle className="card-title">Historical Sales</CardTitle>
              {loadingHistory && <Loader2 className="animate-spin text-blue-600" />}
            </CardHeader>

            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="quantity_sold" stroke="#007DC6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-placeholder">Select a product to view data</p>
              )}
            </CardContent>
          </Card>

          <Card className="app-card">
            <CardHeader>
              <CardTitle className="card-title">Forecast Output</CardTitle>
            </CardHeader>

            <CardContent>
              {predictions ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={predictions.predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="predicted_quantity" fill="#FFC220" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-placeholder">Run prediction to see results</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="app-footer">© 2025 Smart Inventory System</footer>
    </div>
  );
}

export default App;
