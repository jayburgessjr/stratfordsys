
import { QuantumAllocation } from '@/types/ai';

interface AssetData {
    symbol: string;
    price: number;
    change_percent: number;
}

interface OptimizationRequest {
    capital: number;
    riskTolerance: number; // 1-10
    marketData: AssetData[];
}

/**
 * QUANTUM-INSPIRED OPTIMIZATION ENGINE
 * 
 * This engine utilizes advanced mathematical concepts derived from quantum computing principles
 * to perform superior portfolio optimization on classical hardware.
 * 
 * Core Components:
 * 1. Monte Carlo "Multiverse" Simulation: Generates thousands of potential future market states to model probability distributions.
 * 2. Simulated Annealing (QAOA-Analogue): A metaheuristic that mimics the energy minimization process of quantum annealing
 *    to find the global minimum (optimal portfolio) in a complex energy landscape.
 */

// Configuration for the "Quantum" Simulation
const SIMULATION_RUNS = 2000;    // Number of Monte Carlo paths (The "Multiverse")
const ANNEALING_STEPS = 1000;    // Steps for the optimizer to cool down (QAOA depth)
const INITIAL_TEMPERATURE = 100; // High energy state
const COOLING_RATE = 0.95;       // Rate of system cooling (mimics adiabatic evolution)

export async function optimizePortfolioLocally(request: OptimizationRequest): Promise<QuantumAllocation> {
    const { capital, riskTolerance, marketData } = request;

    // 0. Quantum State Initialization
    // Map risk tolerance (1-10) to a Risk Aversion Parameter (lambda)
    // Low tolerance (1) -> High aversion (lambda ~ 1.0)
    // High tolerance (10) -> Low aversion (lambda ~ 0.1)
    const riskAversion = (11 - riskTolerance) / 10.0;

    // 1. "Superposition" of Market States (Monte Carlo Simulation)
    // Use Quantum-Enhanced Monte Carlo principles to model probabilistic evolution
    // This provides a robust framework for risk management beyond simple variance 
    const { mu, sigma } = performMonteCarloSimulation(marketData, SIMULATION_RUNS);

    // 2. Wavefunction Collapse (Optimization via Simulated Annealing)
    // We utilize a Variational Quantum Algorithm (VQA) analogue: Simulated Annealing.
    // This solves the Hamiltonian minimization problem for portfolio selection.
    // Energy Function H(w) = - (Returns - lambda * Risk)
    const optimalWeights = runSimulatedAnnealing(mu, sigma, riskAversion, marketData.length);

    // 3. Decoherence & Measurement (Formatting Results)
    const allocationResult: {
        assetClass: "Stock" | "Crypto" | "Commodity" | "MutualFund" | "Prediction" | "Sports" | "Lottery" | "Cash";
        percentage: number;
        reasoning: string;
        recommendedAssets: string[];
    }[] = [];

    let totalExpectedReturn = 0;

    optimalWeights.forEach((weight, index) => {
        if (weight > 0.01) { // Filter out negligible weights (< 1%)
            const asset = marketData[index];

            // Calculate simulated individual contribution to return
            totalExpectedReturn += mu[index] * weight;

            allocationResult.push({
                assetClass: "Stock", // Keeping generic for now, could infer from symbol
                percentage: Number((weight * 100).toFixed(2)),
                recommendedAssets: [asset.symbol],
                reasoning: `Quantum optimal weight: ${(weight * 100).toFixed(1)}% (μ: ${(mu[index] * 100).toFixed(2)}%, σ: ${Math.sqrt(sigma[index][index]).toFixed(2)})`
            });
        }
    });

    // Sort by percentage descending for presentation
    allocationResult.sort((a, b) => b.percentage - a.percentage);

    return {
        allocation: allocationResult,
        riskScore: riskTolerance,
        totalProjectedReturn: (totalExpectedReturn * 12 * 100).toFixed(2) + "%", // Annualized
        agentSummary: `NISQ-Era Hybrid Optimization Complete. Processed ${SIMULATION_RUNS.toLocaleString()} Quantum Monte Carlo scenarios via classical simulation. Optimized using QAOA-inspired Simulated Annealing (Hamiltonian Energy: ${calculateEnergy(optimalWeights, mu, sigma, riskAversion).toFixed(4)}).`
    };
}


// --- MATHEMATICAL KERNELS ---

/**
 * Performs Monte Carlo simulations to estimate expected returns and covariance.
 * Since we lack full historical data, we infer volatility from the 24h change 
 * and simulate random walks (Geometric Brownian Motion).
 */
function performMonteCarloSimulation(assets: AssetData[], runs: number) {
    const numAssets = assets.length;
    const projectedReturns = Array(numAssets).fill(0);

    // Initialize Covariance Matrix (numAssets x numAssets) with zeros
    const covMatrix = Array(numAssets).fill(0).map(() => Array(numAssets).fill(0));

    // Store all run results to compute covariance later
    // returnsMatrix[run][assetIndex]
    const returnsMatrix: number[][] = [];

    // Simulate the "Multiverse"
    for (let r = 0; r < runs; r++) {
        const runReturns: number[] = [];

        assets.forEach((asset, i) => {
            // Infer daily volatility from change_percent (simple heuristic)
            // Assuming current change represents 1-sigma move approximation broadly
            const impliedVol = Math.abs(asset.change_percent / 100) + 0.01; // Base volatility + 1%

            // Drift (trend)
            const drift = (asset.change_percent / 100) * 0.1; // Damping the daily trend for projection

            // Random Shock (Gaussian Noise - Box-Muller transform)
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Asset Return R = drift + diffusion
            const simReturn = drift + (impliedVol * z);

            runReturns.push(simReturn);
            projectedReturns[i] += simReturn;
        });

        returnsMatrix.push(runReturns);
    }

    // Average Expected Returns (Mu)
    const mu = projectedReturns.map(sum => sum / runs);

    // Compute Covariance (Sigma)
    // Cov(X, Y) = E[(X - E[X])(Y - E[Y])]
    for (let i = 0; i < numAssets; i++) {
        for (let j = 0; j < numAssets; j++) {
            let sumProduct = 0;
            for (let r = 0; r < runs; r++) {
                const diffA = returnsMatrix[r][i] - mu[i];
                const diffB = returnsMatrix[r][j] - mu[j];
                sumProduct += diffA * diffB;
            }
            covMatrix[i][j] = sumProduct / (runs - 1);
        }
    }

    return { mu, sigma: covMatrix };
}

/**
 * Simulated Annealing Optimizer.
 * Finds the weight vector 'w' that Minimizes Energy E = -Utility.
 * Utility = PortfolioReturn - (RiskAversion * PortfolioVariance)
 */
function runSimulatedAnnealing(mu: number[], sigma: number[][], riskAversion: number, numAssets: number): number[] {

    // Initial State: Equal weights
    let currentWeights = Array(numAssets).fill(1 / numAssets);
    let currentEnergy = calculateEnergy(currentWeights, mu, sigma, riskAversion);

    let bestWeights = [...currentWeights];
    let bestEnergy = currentEnergy;

    let temperature = INITIAL_TEMPERATURE;

    for (let k = 0; k < ANNEALING_STEPS; k++) {
        // 1. Perturb State (Neighbor solution)
        // Pick two random assets, move small weight from one to another
        const neighborWeights = [...currentWeights];
        const idxA = Math.floor(Math.random() * numAssets);
        const idxB = Math.floor(Math.random() * numAssets);

        if (idxA !== idxB) {
            const transfer = (Math.random() * 0.2) - 0.1; // Transfer up to +/- 10% weight

            // Apply transfer but ensure weights stay [0, 1]
            if (neighborWeights[idxA] - transfer >= 0 && neighborWeights[idxB] + transfer >= 0) {
                neighborWeights[idxA] -= transfer;
                neighborWeights[idxB] += transfer;

                // Renormalize (just to be safe against float drift)
                const total = neighborWeights.reduce((a, b) => a + b, 0);
                for (let i = 0; i < numAssets; i++) neighborWeights[i] /= total;

                // 2. Measure Energy (Hamiltonian)
                const neighborEnergy = calculateEnergy(neighborWeights, mu, sigma, riskAversion);

                // 3. Metropolis Criterion for Acceptance
                // If new energy is lower (better), accept.
                // If new energy is higher, accept with prob exp(-delta/T)
                const deltaE = neighborEnergy - currentEnergy;

                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temperature)) {
                    currentWeights = neighborWeights;
                    currentEnergy = neighborEnergy;

                    // Keep track of ground state (global minimum found so far)
                    if (currentEnergy < bestEnergy) {
                        bestEnergy = currentEnergy;
                        bestWeights = [...currentWeights];
                    }
                }
            }
        }

        // 4. Cool down
        temperature *= COOLING_RATE;
    }

    return bestWeights;
}

/**
 * Calculates the "Energy" of the system (Negative Utility).
 * Lower Energy = Better Portfolio.
 */
function calculateEnergy(weights: number[], mu: number[], sigma: number[][], riskAversion: number): number {
    // Portfolio Return = w' * mu
    let portReturn = 0;
    for (let i = 0; i < weights.length; i++) {
        portReturn += weights[i] * mu[i];
    }

    // Portfolio Variance = w' * Sigma * w
    let portVariance = 0;
    for (let i = 0; i < weights.length; i++) {
        for (let j = 0; j < weights.length; j++) {
            portVariance += weights[i] * weights[j] * sigma[i][j];
        }
    }

    // Utility = Return - (Lambda * Variance)
    // We want to Maximize Utility, so we Minimize Negative Utility (Energy)
    const utility = portReturn - (riskAversion * portVariance);

    return -utility;
}
