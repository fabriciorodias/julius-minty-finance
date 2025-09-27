import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyNode, SankeyLink } from 'd3-sankey';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SankeyData } from '@/hooks/useCashFlowSankey';

interface FinancialSankeyChartProps {
  data: SankeyData;
  height?: number;
}

// Extend the sankey node/link types with our custom properties
interface ExtendedSankeyNode extends SankeyNode<{}, {}> {
  id: string;
  name: string;
  category: 'income' | 'expense' | 'balance';
  color: string;
}

interface ExtendedSankeyLink extends SankeyLink<{}, {}> {
  source: string;
  target: string;
  value: number;
}

export const FinancialSankeyChart: React.FC<FinancialSankeyChartProps> = ({ 
  data, 
  height = 400 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || !data.links.length) {
      console.log('Sankey chart: No data or missing SVG ref');
      return;
    }

    console.log('Sankey data:', data);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 20, left: 40 };
    const width = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create sankey layout
    const sankeyLayout = sankey()
      .nodeWidth(15)
      .nodePadding(20)
      .extent([[1, 1], [innerWidth - 1, innerHeight - 1]]);

    // Prepare data for d3-sankey - ensure all referenced nodes exist
    const nodeMap = new Map(data.nodes.map(node => [node.id, node]));
    const validLinks = data.links.filter(link => {
      const sourceExists = nodeMap.has(link.source);
      const targetExists = nodeMap.has(link.target);
      if (!sourceExists) console.warn('Missing source node:', link.source);
      if (!targetExists) console.warn('Missing target node:', link.target);
      return sourceExists && targetExists;
    });

    if (validLinks.length === 0) {
      console.log('No valid links for Sankey chart');
      return;
    }

    const graph = {
      nodes: data.nodes.map(d => ({ ...d })) as ExtendedSankeyNode[],
      links: validLinks.map(d => ({ ...d })) as ExtendedSankeyLink[]
    };

    console.log('Processed graph:', graph);

    // Apply sankey layout
    try {
      sankeyLayout(graph as any);
    } catch (error) {
      console.error('Sankey layout error:', error);
      return;
    }

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add links
    g.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => {
        const sourceNode = d.source as any;
        return sourceNode.category === 'income' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))';
      })
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", d => Math.max(1, (d as any).width || 0))
      .attr("fill", "none")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-opacity", 0.6);
        
        // Show tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "hsl(var(--popover))")
          .style("border", "1px solid hsl(var(--border))")
          .style("border-radius", "6px")
          .style("padding", "8px")
          .style("font-size", "12px")
          .style("color", "hsl(var(--popover-foreground))")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .html(`${formatCurrency(d.value || 0)}`);

        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-opacity", 0.3);
        d3.selectAll(".tooltip").remove();
      });

    // Add nodes
    const nodes = g.append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", d => (d as any).x0 || 0)
      .attr("y", d => (d as any).y0 || 0)
      .attr("height", d => ((d as any).y1 || 0) - ((d as any).y0 || 0))
      .attr("width", d => ((d as any).x1 || 0) - ((d as any).x0 || 0))
      .attr("fill", d => d.color)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1)
      .attr("rx", 3);

    // Add node labels
    g.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", d => {
        const nodeWidth = ((d as any).x1 || 0) - ((d as any).x0 || 0);
        if (d.category === 'income') {
          return ((d as any).x0 || 0) - 6;
        } else if (d.category === 'expense') {
          return ((d as any).x1 || 0) + 6;
        } else {
          return ((d as any).x0 || 0) + nodeWidth / 2;
        }
      })
      .attr("y", d => (((d as any).y1 || 0) + ((d as any).y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => {
        if (d.category === 'income') return 'end';
        if (d.category === 'expense') return 'start';
        return 'middle';
      })
      .attr("font-size", "12px")
      .attr("font-weight", d => d.category === 'balance' ? '600' : '400')
      .attr("fill", "hsl(var(--foreground))")
      .text(d => d.name);

    // Add value labels on nodes
    g.append("g")
      .selectAll("text.value")
      .data(graph.nodes.filter(d => d.category !== 'balance'))
      .join("text")
      .attr("class", "value")
      .attr("x", d => {
        if (d.category === 'income') {
          return ((d as any).x0 || 0) - 6;
        } else {
          return ((d as any).x1 || 0) + 6;
        }
      })
      .attr("y", d => (((d as any).y1 || 0) + ((d as any).y0 || 0)) / 2 + 16)
      .attr("text-anchor", d => d.category === 'income' ? 'end' : 'start')
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--muted-foreground))")
      .text(d => {
        const value = (d as any).value || 0;
        return formatCurrency(value);
      });

  }, [data, height]);

  if (!data.nodes.length || !data.links.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fluxo de Recursos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fluxo de Recursos por Categoria</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualização do fluxo de receitas e despesas por categoria no período selecionado
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full" style={{ minWidth: '800px' }} />
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }} />
            <span>Saldo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span>Despesas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};