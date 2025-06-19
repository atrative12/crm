import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Opportunity } from '../../types';

// Adiciona a função autoTable ao tipo do jsPDF para o TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ContractGeneratorProps {
  opportunity: Opportunity;
  onGenerated: () => void;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({ 
  opportunity, 
  onGenerated 
}) => {
  const generateContract = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    
    // Configurações do documento
    let yPosition = 20;
    
    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ATRACTIVE CRM', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão de Relacionamento com Cliente', 105, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(10);
    doc.text('Email: contato@atractive.com | Telefone: (11) 99999-9999', 105, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Título do contrato
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Informações do contrato
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Número do contrato
    const contractNumber = `CTR-${opportunity.id.slice(-8).toUpperCase()}-${currentDate.getFullYear()}`;
    doc.text(`Contrato Nº: ${contractNumber}`, 14, yPosition);
    yPosition += 8;
    
    doc.text(`Data: ${currentDate.toLocaleDateString('pt-BR')}`, 14, yPosition);
    yPosition += 15;
    
    // Partes do contrato
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${opportunity.clientName}`, 14, yPosition);
    yPosition += 6;
    doc.text('Endereço: [A ser preenchido]', 14, yPosition);
    yPosition += 6;
    doc.text('CPF/CNPJ: [A ser preenchido]', 14, yPosition);
    yPosition += 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Atractive CRM Ltda.', 14, yPosition);
    yPosition += 6;
    doc.text('CNPJ: 00.000.000/0001-00', 14, yPosition);
    yPosition += 6;
    doc.text('Endereço: Rua das Empresas, 123 - São Paulo/SP', 14, yPosition);
    yPosition += 15;
    
    // Objeto do contrato
    doc.setFont('helvetica', 'bold');
    doc.text('OBJETO DO CONTRATO:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const objectText = `Prestação de serviços relacionados a: ${opportunity.name}`;
    const splitObject = doc.splitTextToSize(objectText, 180);
    doc.text(splitObject, 14, yPosition);
    yPosition += splitObject.length * 6 + 10;
    
    if (opportunity.description) {
      const descriptionText = `Descrição detalhada: ${opportunity.description}`;
      const splitDescription = doc.splitTextToSize(descriptionText, 180);
      doc.text(splitDescription, 14, yPosition);
      yPosition += splitDescription.length * 6 + 15;
    }
    
    // Valor do contrato
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR DO CONTRATO:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Valor Total: R$ ${opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, yPosition);
    yPosition += 15;
    
    // Condições de pagamento
    doc.setFont('helvetica', 'bold');
    doc.text('CONDIÇÕES DE PAGAMENTO:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const paymentConditions = [
      '• Pagamento à vista ou conforme negociação específica',
      '• Forma de pagamento: PIX, transferência bancária ou boleto',
      '• Vencimento: conforme acordado entre as partes'
    ];
    
    paymentConditions.forEach(condition => {
      doc.text(condition, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
    
    // Prazo de execução
    doc.setFont('helvetica', 'bold');
    doc.text('PRAZO DE EXECUÇÃO:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const expectedDate = opportunity.expectedCloseDate 
      ? new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')
      : 'A ser definido';
    doc.text(`Prazo previsto para conclusão: ${expectedDate}`, 14, yPosition);
    yPosition += 15;
    
    // Cláusulas gerais
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS GERAIS:', 14, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const clauses = [
      '1. Este contrato entra em vigor na data de sua assinatura.',
      '2. Qualquer alteração deve ser feita por escrito e acordada por ambas as partes.',
      '3. O foro competente é o da comarca de São Paulo/SP.',
      '4. As partes se comprometem a cumprir fielmente as condições estabelecidas.'
    ];
    
    clauses.forEach(clause => {
      const splitClause = doc.splitTextToSize(clause, 180);
      doc.text(splitClause, 14, yPosition);
      yPosition += splitClause.length * 6 + 4;
    });
    
    // Nova página se necessário
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition += 20;
    
    // Assinaturas
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS:', 14, yPosition);
    yPosition += 20;
    
    // Linha para assinatura do contratante
    doc.line(14, yPosition, 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('CONTRATANTE', 14, yPosition + 5);
    doc.text(opportunity.clientName, 14, yPosition + 12);
    
    // Linha para assinatura da contratada
    doc.line(110, yPosition, 186, yPosition);
    doc.text('CONTRATADA', 110, yPosition + 5);
    doc.text('Atractive CRM Ltda.', 110, yPosition + 12);
    
    // Rodapé
    yPosition += 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Contrato gerado automaticamente pelo sistema Atractive CRM em ${currentDate.toLocaleString('pt-BR')}`, 105, yPosition, { align: 'center' });
    
    // Salvar o PDF
    const fileName = `contrato_${opportunity.clientName.replace(/\s+/g, '_')}_${contractNumber}.pdf`;
    doc.save(fileName);
    
    onGenerated();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📄 Geração de Contrato
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Um contrato profissional será gerado em PDF com todas as informações da oportunidade.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Informações do Contrato:
          </h5>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Cliente:</strong> {opportunity.clientName}</p>
            <p><strong>Serviço:</strong> {opportunity.name}</p>
            <p><strong>Valor:</strong> R$ {opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            {opportunity.description && (
              <p><strong>Descrição:</strong> {opportunity.description}</p>
            )}
            {opportunity.expectedCloseDate && (
              <p><strong>Prazo:</strong> {new Date(opportunity.expectedCloseDate).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Nota:</strong> Após a geração, revise o contrato e preencha as informações complementares 
            (endereço do cliente, CPF/CNPJ, etc.) antes de enviar para assinatura.
          </p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={generateContract}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          📄 Gerar Contrato em PDF
        </button>
      </div>
    </div>
  );
};