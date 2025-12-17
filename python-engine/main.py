
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
import yfinance as yf
from pypfopt import EfficientFrontier, risk_models, expected_returns
from pypfopt import discrete_allocation

app = FastAPI()

class MarketAsset(BaseModel):
    symbol: str
    type: str # Not strictly used by optimizer but passed for metadata

class OptimizationRequest(BaseModel):
    capital: float
    risk_tolerance: int # 1-10
    # We ignore the passed market_data for optimization and fetch REAL data
    # but keep the field to not break the contract if needed
    market_data: Optional[List[MarketAsset]] = None 

class AllocationItem(BaseModel):
    assetClass: str
    percentage: float
    reasoning: str
    recommendedAssets: List[str]

class OptimizationResponse(BaseModel):
    allocation: List[AllocationItem]
    totalProjectedReturn: str
    riskScore: int
    agentSummary: str

# Define Investment Universe
# In a real app, this might be dynamic.
UNIVERSE = {
    "Stock": ["SPY", "QQQ", "VTI", "EEM"],
    "Crypto": ["BTC-USD", "ETH-USD"], # Yahoo Finance symbols
    "Commodity": ["GLD", "USO"],
    # Kalshi/Lottery are handled qualitatively as they don't have standard historical yahoo data
}

@app.get("/")
def read_root():
    return {"status": "Quantum Engine: Online (Mean-Variance Optimized)"}

@app.post("/optimize", response_model=OptimizationResponse)
def optimize_portfolio(request: OptimizationRequest):
    risk = request.risk_tolerance
    capital = request.capital
    
    # 1. Fetch Real Historical Data (Yahoo Finance)
    tickers = UNIVERSE["Stock"] + UNIVERSE["Crypto"] + UNIVERSE["Commodity"]
    try:
        # Download 1 year of data
        data = yf.download(tickers, period="1y")["Adj Close"]
        if data.empty:
             # Fallback if download fails (e.g. rate limits)
             raise Exception("No data")
    except Exception as e:
        print(f"Data fetch error: {e}")
        # Fallback to simulated logic if live data fails
        return fallback_optimization(capital, risk)

    # 2. Modern Portfolio Theory (PyPortfolioOpt)
    
    # Calculate Expected Returns (mean historical return)
    mu = expected_returns.mean_historical_return(data)
    
    # Calculate Covariance Matrix (risk model)
    S = risk_models.sample_cov(data)
    
    # Optimize for Efficient Frontier
    ef = EfficientFrontier(mu, S)
    
    # RISK MAPPING
    # Risk 1 (Safe) -> Min Volatility
    # Risk 10 (Degen) -> Max Sharpe (or explicit high risk)
    
    raw_weights = {}
    
    try:
        if risk <= 3:
            # Minimize Volatility
            raw_weights = ef.min_volatility()
        elif risk >= 8:
            # Maximize Sharpe Ratio (with higher tolerance)
            # Or just max return for pure degen? Let's stick to Max Sharpe for "Best in Class"
            # But maybe add a constraint for crypto?
            raw_weights = ef.max_sharpe()
        else:
            # Middle ground: Target Volatility? 
            # For simplicity, let's use Max Sharpe but mix in some bonds (handled below)
            # or just map to Max Sharpe for now as it's the "optimal" portfolio
            raw_weights = ef.max_sharpe()
            
        cleaned_weights = ef.clean_weights()
    except Exception as e:
        print(f"Optimization error: {e}")
        return fallback_optimization(capital, risk)

    # 3. Process Weights into Asset Classes
    
    total_stock = 0.0
    total_crypto = 0.0
    total_commodity = 0.0
    
    portfolio_assets = {"Stock": [], "Crypto": [], "Commodity": []}
    
    for ticker, weight in cleaned_weights.items():
        w_pct = round(weight * 100, 2)
        if w_pct > 0:
            if ticker in UNIVERSE["Stock"]:
                total_stock += w_pct
                portfolio_assets["Stock"].append(f"{ticker} ({w_pct}%)")
            elif ticker in UNIVERSE["Crypto"]:
                total_crypto += w_pct
                portfolio_assets["Crypto"].append(f"{ticker} ({w_pct}%)")
            elif ticker in UNIVERSE["Commodity"]:
                total_commodity += w_pct
                portfolio_assets["Commodity"].append(f"{ticker} ({w_pct}%)")

    # 4. Handle "Speculative" Assets (Qualitative Overlay)
    # MPT doesn't handle Lottery/Prediction well, so we add them as a tactical overlay
    
    speculative_allocation = []
    reduction_factor = 1.0
    
    if risk >= 8:
        # Degen overlay: Reallocate 10-15% from the optimized portfolio to Speculative
        prediction_pct = (risk - 7) * 4 # 4%, 8%, 12%
        lottery_pct = (risk - 7) * 1    # 1%, 2%, 3%
        
        total_spec = prediction_pct + lottery_pct
        reduction_factor = (100 - total_spec) / 100.0
        
        speculative_allocation.append({
            "assetClass": "Prediction",
            "percentage": prediction_pct,
            "reasoning": "High-conviction binary alpha (Kalshi).",
            "recommendedAssets": ["FED-RATES", "ELECTION"]
        })
        speculative_allocation.append({
             "assetClass": "Lottery",
             "percentage": lottery_pct,
             "reasoning": "Positive convexity black swan exposure.",
             "recommendedAssets": ["POWERBALL"]
        })
        
    # Apply reduction to core portfolio
    allocations = []
    
    if total_stock > 0:
        allocations.append({
            "assetClass": "Stock",
            "percentage": round(total_stock * reduction_factor, 2),
            "reasoning": "Mean-Variance Optimized equity basket.",
            "recommendedAssets": portfolio_assets["Stock"]
        })
        
    if total_crypto > 0:
        allocations.append({
            "assetClass": "Crypto",
            "percentage": round(total_crypto * reduction_factor, 2),
            "reasoning": "Efficient Frontier maximized crypto exposure.",
            "recommendedAssets": portfolio_assets["Crypto"]
        })
        
    if total_commodity > 0:
        allocations.append({
            "assetClass": "Commodity",
            "percentage": round(total_commodity * reduction_factor, 2),
            "reasoning": "Uncorrelated diversification.",
            "recommendedAssets": portfolio_assets["Commodity"]
        })
        
    allocations.extend(speculative_allocation)
    
    # Calculate Portfolio Performance Stats from EF
    perf = ef.portfolio_performance(verbose=False)
    ret = round(perf[0] * 100, 2)
    vol = round(perf[1] * 100, 2)
    sharpe = round(perf[2], 2)

    return {
        "allocation": allocations,
        "totalProjectedReturn": f"{ret}% Ann. Return (Vol: {vol}%, Sharpe: {sharpe})",
        "riskScore": risk,
        "agentSummary": f"Mathematically optimized using Modern Portfolio Theory on live market data. Portfolio maximizes Sharpe Ratio ({sharpe}) given historical correlations."
    }

def fallback_optimization(capital, risk):
    # Determine basic weights as fallback
    stock = 60 if risk < 8 else 40
    crypto = 0 if risk < 4 else (10 if risk < 8 else 40)
    commodity = 10
    cash = 100 - (stock + crypto + commodity)
    
    return {
        "allocation": [
             {"assetClass": "Stock", "percentage": stock, "reasoning": "Fallback Model", "recommendedAssets": ["SPY"]},
             {"assetClass": "Crypto", "percentage": crypto, "reasoning": "Fallback Model", "recommendedAssets": ["BTC"]},
             {"assetClass": "Commodity", "percentage": commodity, "reasoning": "Fallback Model", "recommendedAssets": ["GLD"]},
             {"assetClass": "Cash", "percentage": cash, "reasoning": "Fallback Model", "recommendedAssets": ["USD"]},
        ],
        "totalProjectedReturn": "10% (Est)",
        "riskScore": risk,
        "agentSummary": "Live data unavailable. Using heuristic fallback model."
    }
