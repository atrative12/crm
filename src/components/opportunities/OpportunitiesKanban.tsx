import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Calendar, User, Edit, BarChart2, Flag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { OpportunityForm } from './OpportunityForm';
import { useData } from '../../contexts/DataContext';
import { Opportunity } from '../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Adiciona a função autoTable ao tipo do jsPDF para o TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportData {
  totalOpportunities: number;
  won: number;
  lost: number;
  open: number;
  totalValueWon: number;
}

const stages = [
    { id: 'novo-lead', name: 'Novo Lead', color: 'bg-blue-500' },
    { id: 'contato-inicial', name: 'Contato Inicial', color: 'bg-indigo-500' },
    { id: 'qualificacao', name: 'Qualificação', color: 'bg-purple-500' },
    { id: 'proposta', name: 'Proposta', color: 'bg-yellow-500' },
    { id: 'negociacao', name: 'Negociação', color: 'bg-orange-500' },
    { id: 'fechado-ganhou', name: 'Fechado (Ganhou)', color: 'bg-green-500' },
    { id: 'fechado-perdeu', name: 'Fechado (Perdeu)', color: 'bg-red-500' }
];

export const OpportunitiesKanban: React.FC = () => {
  const { clients, opportunities, addOpportunity, updateOpportunity, updateClient } = useData();
  
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const handleAddOpportunity = () => {
    setSelectedOpportunity(null);
    setIsOpportunityModalOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsOpportunityModalOpen(true);
  };

  const handleSaveOpportunity = (formData: Omit<Opportunity, 'id' | 'createdAt'>) => {
    if (selectedOpportunity) {
      updateOpportunity({ ...selectedOpportunity, ...formData });
    } else {
      addOpportunity(formData);
    }
    setIsOpportunityModalOpen(false);
  };
  
  const handleGeneratePdf = () => {
    const currentDate = new Date();
    const reportDate = new Date(selectedYear, selectedMonth);
    const previousMonth = new Date(selectedYear, selectedMonth - 1);
    
    // Filtrar dados do mês selecionado
    const opportunitiesInPeriod = opportunities.filter(opp => {
      const oppDate = new Date(opp.createdAt);
      return oppDate.getMonth() === selectedMonth && oppDate.getFullYear() === selectedYear;
    });

    const clientsInPeriod = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === selectedMonth && clientDate.getFullYear() === selectedYear;
    });

    // Filtrar dados do mês anterior para comparação
    const opportunitiesPreviousMonth = opportunities.filter(opp => {
      const oppDate = new Date(opp.createdAt);
      return oppDate.getMonth() === previousMonth.getMonth() && oppDate.getFullYear() === previousMonth.getFullYear();
    });

    const clientsPreviousMonth = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === previousMonth.getMonth() && clientDate.getFullYear() === previousMonth.getFullYear();
    });

    if (opportunitiesInPeriod.length === 0 && clientsInPeriod.length === 0) {
      alert(`Nenhum dado encontrado para ${months[selectedMonth]} de ${selectedYear}.`);
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;

    // Cabeçalho do relatório
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO EXECUTIVO DE VENDAS', 105, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${months[selectedMonth]}/${selectedYear}`, 105, yPosition, { align: 'center' });
    yPosition += 5;

    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate.toLocaleDateString('pt-BR')} às ${currentDate.toLocaleTimeString('pt-BR')}`, 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Resumo Executivo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 14, yPosition);
    yPosition += 10;

    // Métricas principais
    const wonOpportunities = opportunitiesInPeriod.filter(o => o.status === 'fechado-ganhou');
    const lostOpportunities = opportunitiesInPeriod.filter(o => o.status === 'fechado-perdeu');
    const totalValueWon = wonOpportunities.reduce((sum, o) => sum + o.value, 0);
    const totalValueLost = lostOpportunities.reduce((sum, o) => sum + o.value, 0);
    
    // Métricas do mês anterior
    const wonOpportunitiesPrev = opportunitiesPreviousMonth.filter(o => o.status === 'fechado-ganhou');
    const totalValueWonPrev = wonOpportunitiesPrev.reduce((sum, o) => sum + o.value, 0);

    // Cálculos de crescimento
    const clientGrowth = clientsPreviousMonth.length > 0 
      ? ((clientsInPeriod.length - clientsPreviousMonth.length) / clientsPreviousMonth.length * 100).toFixed(1)
      : clientsInPeriod.length > 0 ? '100.0' : '0.0';

    const revenueGrowth = totalValueWonPrev > 0 
      ? ((totalValueWon - totalValueWonPrev) / totalValueWonPrev * 100).toFixed(1)
      : totalValueWon > 0 ? '100.0' : '0.0';

    const conversionRate = opportunitiesInPeriod.length > 0 
      ? (wonOpportunities.length / opportunitiesInPeriod.length * 100).toFixed(1)
      : '0.0';

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Métrica', 'Valor Atual', 'Mês Anterior', 'Variação'],
      ['Novos Clientes', clientsInPeriod.length.toString(), clientsPreviousMonth.length.toString(), `${clientGrowth}%`],
      ['Oportunidades Criadas', opportunitiesInPeriod.length.toString(), opportunitiesPreviousMonth.length.toString(), `${((opportunitiesInPeriod.length - opportunitiesPreviousMonth.length) / Math.max(opportunitiesPreviousMonth.length, 1) * 100).toFixed(1)}%`],
      ['Vendas Fechadas', wonOpportunities.length.toString(), wonOpportunitiesPrev.length.toString(), `${((wonOpportunities.length - wonOpportunitiesPrev.length) / Math.max(wonOpportunitiesPrev.length, 1) * 100).toFixed(1)}%`],
      ['Receita Total', `R$ ${totalValueWon.toLocaleString('pt-BR')}`, `R$ ${totalValueWonPrev.toLocaleString('pt-BR')}`, `${revenueGrowth}%`],
      ['Taxa de Conversão', `${conversionRate}%`, `${opportunitiesPreviousMonth.length > 0 ? (wonOpportunitiesPrev.length / opportunitiesPreviousMonth.length * 100).toFixed(1) : '0.0'}%`, '-']
    ];

    doc.autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { 
          cellPadding: 3,
          didParseCell: function(data: any) {
            if (data.cell.text[0] && data.cell.text[0].includes('%')) {
              const value = parseFloat(data.cell.text[0]);
              if (value > 0) {
                data.cell.styles.textColor = [34, 197, 94]; // Verde
              } else if (value < 0) {
                data.cell.styles.textColor = [239, 68, 68]; // Vermelho
              }
            }
          }
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Análise Detalhada por Dia
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISE DIÁRIA DETALHADA', 14, yPosition);
    yPosition += 10;

    // Agrupar dados por dia
    const dailyData: { [key: string]: { clients: number; opportunities: number; revenue: number } } = {};
    
    // Processar clientes por dia
    clientsInPeriod.forEach(client => {
      const date = new Date(client.createdAt).toLocaleDateString('pt-BR');
      if (!dailyData[date]) {
        dailyData[date] = { clients: 0, opportunities: 0, revenue: 0 };
      }
      dailyData[date].clients++;
    });

    // Processar oportunidades por dia
    opportunitiesInPeriod.forEach(opp => {
      const date = new Date(opp.createdAt).toLocaleDateString('pt-BR');
      if (!dailyData[date]) {
        dailyData[date] = { clients: 0, opportunities: 0, revenue: 0 };
      }
      dailyData[date].opportunities++;
      if (opp.status === 'fechado-ganhou') {
        dailyData[date].revenue += opp.value;
      }
    });

    // Criar tabela de dados diários
    const dailyTableData = Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime())
      .map(([date, data]) => [
        date,
        data.clients.toString(),
        data.opportunities.toString(),
        `R$ ${data.revenue.toLocaleString('pt-BR')}`
      ]);

    if (dailyTableData.length > 0) {
      doc.autoTable({
        head: [['Data', 'Novos Clientes', 'Oportunidades', 'Receita Fechada']],
        body: dailyTableData,
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Nova página se necessário
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Análise por Status das Oportunidades
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PIPELINE DE VENDAS', 14, yPosition);
    yPosition += 10;

    const pipelineData = stages.map(stage => {
      const stageOpportunities = opportunitiesInPeriod.filter(opp => opp.status === stage.id);
      const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
      return [
        stage.name,
        stageOpportunities.length.toString(),
        `R$ ${stageValue.toLocaleString('pt-BR')}`,
        opportunitiesInPeriod.length > 0 ? `${(stageOpportunities.length / opportunitiesInPeriod.length * 100).toFixed(1)}%` : '0%'
      ];
    });

    doc.autoTable({
      head: [['Status', 'Quantidade', 'Valor Total', '% do Total']],
      body: pipelineData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Insights e Recomendações
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INSIGHTS E RECOMENDAÇÕES', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const insights = [];
    
    if (parseFloat(clientGrowth) > 0) {
      insights.push(`✓ Crescimento positivo de ${clientGrowth}% em novos clientes comparado ao mês anterior.`);
    } else if (parseFloat(clientGrowth) < 0) {
      insights.push(`⚠ Redução de ${Math.abs(parseFloat(clientGrowth))}% em novos clientes. Revisar estratégias de aquisição.`);
    }

    if (parseFloat(revenueGrowth) > 0) {
      insights.push(`✓ Receita cresceu ${revenueGrowth}% em relação ao mês anterior.`);
    } else if (parseFloat(revenueGrowth) < 0) {
      insights.push(`⚠ Receita diminuiu ${Math.abs(parseFloat(revenueGrowth))}%. Focar em conversão de leads.`);
    }

    if (parseFloat(conversionRate) > 20) {
      insights.push(`✓ Excelente taxa de conversão de ${conversionRate}%.`);
    } else if (parseFloat(conversionRate) < 10) {
      insights.push(`⚠ Taxa de conversão baixa (${conversionRate}%). Revisar processo de qualificação.`);
    }

    const openOpportunities = opportunitiesInPeriod.filter(o => !['fechado-ganhou', 'fechado-perdeu'].includes(o.status));
    if (openOpportunities.length > 0) {
      insights.push(`→ ${openOpportunities.length} oportunidades ainda em aberto com potencial de R$ ${openOpportunities.reduce((sum, o) => sum + o.value, 0).toLocaleString('pt-BR')}.`);
    }

    insights.forEach(insight => {
      doc.text(insight, 14, yPosition, { maxWidth: 180 });
      yPosition += 7;
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Atractive CRM - Relatório Confidencial', 14, 290);
    }

    doc.save(`relatorio_completo_${months[selectedMonth]}_${selectedYear}.pdf`);
    setIsReportModalOpen(false);
  };

  const months = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const opportunity = opportunities.find(opp => opp.id === draggableId);

    if (opportunity) {
        const updatedOpportunity = { ...opportunity, status: destination.droppableId };
        updateOpportunity(updatedOpportunity);

        if (destination.droppableId === 'fechado-ganhou') {
            const clientToUpdate = clients.find(c => c.nomeCompleto === updatedOpportunity.clientName);
            if (clientToUpdate) {
                updateClient({ ...clientToUpdate, status: 'Fechado (Ganhou)' });
            }
        }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pipeline de Oportunidades</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Arraste os cards para gerenciar suas vendas</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsReportModalOpen(true)} variant='outline' className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Relatório Executivo
            </Button>
            <Button onClick={handleAddOpportunity} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nova Oportunidade
            </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageOpportunities = opportunities.filter(op => op.status === stage.id);
            const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div className="flex-shrink-0 w-80">
                    <Card className={`h-full flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-primary-100/50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <div className="p-4 border-b-4" style={{ borderColor: stage.color.replace('bg-', '') }}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{stageOpportunities.length}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">R$ {totalValue.toLocaleString()}</div>
                      </div>
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[400px]"
                      >
                        {stageOpportunities.map((opportunity, index) => (
                          <Draggable key={opportunity.id} draggableId={opportunity.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                className={`p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow ${snapshot.isDragging ? 'ring-2 ring-primary-500 shadow-xl' : 'shadow-sm'}`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm" onClick={() => handleEditOpportunity(opportunity)}>{opportunity.name}</h4>
                                  <button onClick={(e) => { e.stopPropagation(); handleEditOpportunity(opportunity);}} className="p-1 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><Edit className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><User className="w-3 h-3" /><span>{opportunity.clientName}</span></div>
                                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><DollarSign className="w-3 h-3" /><span className="font-medium">R$ {opportunity.value.toLocaleString()}</span></div>
                                  {opportunity.expectedCloseDate && <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Flag className="w-3 h-3" /><span>Fechar em: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span></div>}
                                  {opportunity.nextAction && (<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300"><strong>Próxima ação:</strong> {opportunity.nextAction}</div>)}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </Card>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      
      <Modal isOpen={isOpportunityModalOpen} onClose={() => setIsOpportunityModalOpen(false)} title={selectedOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}>
        <OpportunityForm opportunity={selectedOpportunity} onClose={() => setIsOpportunityModalOpen(false)} onSave={handleSaveOpportunity} />
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Gerar Relatório Executivo" size="md">
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Relatório Completo</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Este relatório incluirá análises detalhadas por dia, comparativos com o mês anterior, 
                    métricas de crescimento e insights estratégicos.
                </p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selecione o período para análise:
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mês</label>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        >
                            {months.map((month, index) => (
                                <option key={month} value={index}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ano</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">O relatório incluirá:</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Resumo executivo com métricas principais</li>
                    <li>• Análise diária detalhada de clientes e oportunidades</li>
                    <li>• Comparativo com o mês anterior</li>
                    <li>• Pipeline de vendas por status</li>
                    <li>• Insights e recomendações estratégicas</li>
                    <li>• Gráficos de crescimento e tendências</li>
                </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>
                    Cancelar
                </Button>
                <Button onClick={handleGeneratePdf} className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" />
                    Gerar Relatório PDF
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};