
import { NextResponse } from 'next/server';
import { QuantumAgent } from '@/lib/agents/quantum-agent';

export async function POST(req: Request) {
    try {
        const { capital, risk } = await req.json();

        if (!capital || !risk) {
            return NextResponse.json(
                { error: 'Missing capital or risk parameters' },
                { status: 400 }
            );
        }

        const agent = new QuantumAgent();
        // risk is 1-10, passed directly
        const allocation = await agent.generatePortfolio(capital, risk);

        return NextResponse.json(allocation);
    } catch (error) {
        console.error('Quantum Agent API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate quantum allocation' },
            { status: 500 }
        );
    }
}
