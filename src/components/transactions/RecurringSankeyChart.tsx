import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SankeyData } from '@/hooks/useRecurringSankey';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface RecurringSankeyChartProps {
  data: SankeyData;
  height?: number;
}

export const RecurringSankeyChart: React.FC<RecurringSankeyChartProps> = ({ 
  data, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || !svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 800 - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Preparar dados seguindo formato padrão do D3 Sankey
    const sankeyData: any = {
      nodes: data.nodes.map((node, index) => ({ 
        ...node, 
        index 
      })),
      links: data.links.map(link => ({
        source: data.nodes.findIndex(n => n.id === link.source),
        target: data.nodes.findIndex(n => n.id === link.target),
        value: link.value
      }))
    };

    // Validar se há dados suficientes
    if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
      return;
    }

    // Criar layout Sankey
    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, chartHeight - 1]]);

    try {
      const processedData = sankeyGenerator(sankeyData);

      const g = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Adicionar links
      g.append("g")
        .selectAll("path")
        .data(processedData.links)
        .enter()
        .append("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", (d: any) => {
          const sourceNode = data.nodes[d.source.index];
          return sourceNode?.color || "#999";
        })
        .attr("stroke-width", (d: any) => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("opacity", 0.6)
        .on("mouseover", function(event: any, d: any) {
          d3.select(this).attr("opacity", 0.8);
          
          // Tooltip
          const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "8px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000");

          tooltip.html(`
            <div>
              <strong>${data.nodes[d.source.index]?.name} → ${data.nodes[d.target.index]?.name}</strong><br/>
              Valor: ${formatCurrency(d.value)}
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity", 0.6);
          d3.selectAll(".tooltip").remove();
        });

      // Adicionar nós
      const node = g.append("g")
        .selectAll("rect")
        .data(processedData.nodes)
        .enter()
        .append("g");

      node.append("rect")
        .attr("x", (d: any) => d.x0)
        .attr("y", (d: any) => d.y0)
        .attr("height", (d: any) => d.y1 - d.y0)
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("fill", (d: any) => {
          return data.nodes[d.index]?.color || "#999";
        })
        .attr("stroke", "none")
        .on("mouseover", function(event: any, d: any) {
          const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "8px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000");

          const totalValue = d.value || 0;

          tooltip.html(`
            <div>
              <strong>${data.nodes[d.index]?.name}</strong><br/>
              Valor: ${formatCurrency(totalValue)}
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.selectAll(".tooltip").remove();
        });

      // Adicionar labels dos nós
      node.append("text")
        .attr("x", (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", (d: any) => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", (d: any) => d.x0 < width / 2 ? "start" : "end")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text((d: any) => data.nodes[d.index]?.name || 'Nome não encontrado');

    } catch (error) {
      console.error('Erro ao criar gráfico Sankey:', error);
    }
  }, [data, height]);

  // Verificar se há dados
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Receitas e Despesas Recorrentes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Nenhum lançamento recorrente encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais para o cabeçalho
  const totalIncome = data.links
    .filter(link => link.target === 'balance')
    .reduce((sum, link) => sum + link.value, 0);
  
  const totalExpense = data.links
    .filter(link => link.source === 'balance')
    .reduce((sum, link) => sum + link.value, 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Receitas e Despesas Recorrentes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualização do fluxo de recursos mensais baseado em lançamentos recorrentes ativos
        </p>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="flex gap-6 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Receitas Mensais</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Despesas Mensais</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saldo Líquido</p>
            <p className={`text-lg font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>

        {/* Gráfico Sankey */}
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef}></svg>
        </div>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <span>Saldo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
            <span>Despesas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};