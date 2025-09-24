import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  margin?: number;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

// Exportar treino para PDF
export async function exportWorkoutToPDF(
  workout: any,
  options: ExportOptions = {}
) {
  const {
    filename = `treino_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'portrait',
    format = 'a4',
    margin = 20,
    includeDate = true,
    includePageNumbers = true
  } = options;

  const pdf = new jsPDF(orientation, 'mm', format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = margin;

  // Configurar fontes
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');

  // Título
  pdf.text('PLANO DE TREINO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Informações do treino
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome: ${workout.name}`, margin, yPosition);
  yPosition += 8;

  if (workout.description) {
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(workout.description, pageWidth - 2 * margin);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 5;
  }

  // Data
  if (includeDate) {
    pdf.setFontSize(10);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    yPosition += 10;
  }

  // Linha divisória
  pdf.setDrawColor(255, 215, 0); // Dourado
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Exercícios
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXERCÍCIOS', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  if (workout.exercises && workout.exercises.length > 0) {
    workout.exercises.forEach((exercise: any, index: number) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Nome do exercício
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${exercise.name}`, margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');

      // Detalhes do exercício
      const details = [];
      if (exercise.sets) details.push(`Séries: ${exercise.sets}`);
      if (exercise.reps) details.push(`Repetições: ${exercise.reps}`);
      if (exercise.weight) details.push(`Carga: ${exercise.weight}kg`);
      if (exercise.duration) details.push(`Duração: ${exercise.duration}s`);
      if (exercise.rest) details.push(`Descanso: ${exercise.rest}s`);

      if (details.length > 0) {
        pdf.text(details.join(' | '), margin + 5, yPosition);
        yPosition += 6;
      }

      // Observações
      if (exercise.notes) {
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        const notes = pdf.splitTextToSize(`Obs: ${exercise.notes}`, pageWidth - 2 * margin - 5);
        pdf.text(notes, margin + 5, yPosition);
        yPosition += notes.length * 4 + 2;
        pdf.setTextColor(0);
        pdf.setFontSize(10);
      }

      yPosition += 4;
    });
  }

  // Rodapé com número de página
  if (includePageNumbers) {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        'FitGenius - Gestão Fitness Inteligente',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  // Salvar PDF
  pdf.save(filename);
}

// Exportar avaliação física para PDF
export async function exportAssessmentToPDF(
  assessment: any,
  options: ExportOptions = {}
) {
  const {
    filename = `avaliacao_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'portrait',
    format = 'a4',
    margin = 20,
    includeDate = true,
    includePageNumbers = true
  } = options;

  const pdf = new jsPDF(orientation, 'mm', format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = margin;

  // Título
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AVALIAÇÃO FÍSICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Informações do cliente
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  if (assessment.client) {
    pdf.text(`Cliente: ${assessment.client.name}`, margin, yPosition);
    yPosition += 7;
  }

  pdf.text(`Data: ${new Date(assessment.assessmentDate).toLocaleDateString('pt-BR')}`, margin, yPosition);
  yPosition += 7;

  if (assessment.professional) {
    pdf.text(`Profissional: ${assessment.professional.name}`, margin, yPosition);
    yPosition += 10;
  }

  // Linha divisória
  pdf.setDrawColor(255, 215, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Medidas Corporais
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MEDIDAS CORPORAIS', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const measures = [
    { label: 'Peso', value: `${assessment.weight} kg`, important: true },
    { label: 'Altura', value: `${assessment.height} cm` },
    { label: 'IMC', value: assessment.bmi?.toFixed(2), important: true },
    { label: 'Gordura Corporal', value: assessment.bodyFat ? `${assessment.bodyFat}%` : '-' },
    { label: 'Massa Muscular', value: assessment.muscleMass ? `${assessment.muscleMass} kg` : '-' },
    { label: 'Gordura Visceral', value: assessment.visceralFat || '-' },
    { label: 'Taxa Metabólica Basal', value: assessment.basalMetabolicRate ? `${assessment.basalMetabolicRate} kcal` : '-' }
  ];

  measures.forEach(measure => {
    if (measure.important) {
      pdf.setFont('helvetica', 'bold');
    }
    pdf.text(`${measure.label}: ${measure.value}`, margin + 5, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 6;
  });

  yPosition += 5;

  // Circunferências
  if (assessment.measurements) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CIRCUNFERÊNCIAS', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const measurements = [
      { label: 'Pescoço', value: assessment.measurements.neck },
      { label: 'Ombros', value: assessment.measurements.shoulders },
      { label: 'Peito', value: assessment.measurements.chest },
      { label: 'Cintura', value: assessment.measurements.waist },
      { label: 'Abdômen', value: assessment.measurements.abdomen },
      { label: 'Quadril', value: assessment.measurements.hips },
      { label: 'Braço D', value: assessment.measurements.rightArm },
      { label: 'Braço E', value: assessment.measurements.leftArm },
      { label: 'Coxa D', value: assessment.measurements.rightThigh },
      { label: 'Coxa E', value: assessment.measurements.leftThigh },
      { label: 'Panturrilha D', value: assessment.measurements.rightCalf },
      { label: 'Panturrilha E', value: assessment.measurements.leftCalf }
    ];

    // Duas colunas para medidas
    const col1 = measurements.slice(0, 6);
    const col2 = measurements.slice(6);

    col1.forEach((measurement, index) => {
      if (measurement.value) {
        pdf.text(`${measurement.label}: ${measurement.value} cm`, margin + 5, yPosition);
        if (col2[index]?.value) {
          pdf.text(`${col2[index].label}: ${col2[index].value} cm`, pageWidth / 2 + 5, yPosition);
        }
        yPosition += 6;
      }
    });
  }

  yPosition += 5;

  // Dobras Cutâneas
  if (assessment.skinfolds) {
    // Verificar nova página
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOBRAS CUTÂNEAS', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const skinfolds = [
      { label: 'Tríceps', value: assessment.skinfolds.triceps },
      { label: 'Bíceps', value: assessment.skinfolds.biceps },
      { label: 'Subescapular', value: assessment.skinfolds.subscapular },
      { label: 'Suprailíaca', value: assessment.skinfolds.suprailiac },
      { label: 'Abdominal', value: assessment.skinfolds.abdominal },
      { label: 'Coxa', value: assessment.skinfolds.thigh },
      { label: 'Peitoral', value: assessment.skinfolds.chest }
    ];

    skinfolds.forEach(fold => {
      if (fold.value) {
        pdf.text(`${fold.label}: ${fold.value} mm`, margin + 5, yPosition);
        yPosition += 6;
      }
    });
  }

  // Observações
  if (assessment.notes) {
    yPosition += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const notes = pdf.splitTextToSize(assessment.notes, pageWidth - 2 * margin);
    pdf.text(notes, margin, yPosition);
  }

  // Rodapé
  if (includePageNumbers) {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        'FitGenius - Gestão Fitness Inteligente',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  pdf.save(filename);
}

// Exportar plano nutricional para PDF
export async function exportNutritionPlanToPDF(
  plan: any,
  options: ExportOptions = {}
) {
  const {
    filename = `plano_nutricional_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'portrait',
    format = 'a4',
    margin = 20,
    includeDate = true,
    includePageNumbers = true
  } = options;

  const pdf = new jsPDF(orientation, 'mm', format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = margin;

  // Título
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PLANO NUTRICIONAL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Informações do plano
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Plano: ${plan.title}`, margin, yPosition);
  yPosition += 7;

  if (plan.description) {
    pdf.setFontSize(10);
    const desc = pdf.splitTextToSize(plan.description, pageWidth - 2 * margin);
    pdf.text(desc, margin, yPosition);
    yPosition += desc.length * 5 + 5;
  }

  // Metas nutricionais
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('METAS DIÁRIAS', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const goals = [
    { label: 'Calorias', value: `${plan.dailyCalories} kcal` },
    { label: 'Carboidratos', value: `${plan.dailyCarbs}g` },
    { label: 'Proteínas', value: `${plan.dailyProtein}g` },
    { label: 'Gorduras', value: `${plan.dailyFat}g` },
    { label: 'Fibras', value: plan.dailyFiber ? `${plan.dailyFiber}g` : '-' },
    { label: 'Água', value: plan.dailyWater ? `${plan.dailyWater}ml` : '-' }
  ];

  goals.forEach(goal => {
    pdf.text(`${goal.label}: ${goal.value}`, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Refeições
  if (plan.meals && plan.meals.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REFEIÇÕES', margin, yPosition);
    yPosition += 8;

    plan.meals.forEach((meal: any) => {
      // Verificar nova página
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${meal.name}${meal.time ? ` - ${meal.time}` : ''}`, margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      if (meal.foods && meal.foods.length > 0) {
        meal.foods.forEach((food: any) => {
          pdf.text(`• ${food.food.name} - ${food.quantity}g`, margin + 5, yPosition);
          yPosition += 5;

          if (food.notes) {
            pdf.setFontSize(9);
            pdf.setTextColor(100);
            pdf.text(`  ${food.notes}`, margin + 8, yPosition);
            yPosition += 4;
            pdf.setTextColor(0);
            pdf.setFontSize(10);
          }
        });
      }

      yPosition += 3;
    });
  }

  // Observações
  if (plan.notes) {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES DO PROFISSIONAL', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const notes = pdf.splitTextToSize(plan.notes, pageWidth - 2 * margin);
    pdf.text(notes, margin, yPosition);
  }

  // Rodapé
  if (includePageNumbers) {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        'FitGenius - Gestão Fitness Inteligente',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  pdf.save(filename);
}

// Exportar elemento HTML para PDF (genérico)
export async function exportElementToPDF(
  elementId: string,
  filename: string = 'document.pdf',
  options: ExportOptions = {}
) {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error('Elemento não encontrado');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF(options.orientation || 'portrait', 'mm', options.format || 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = options.margin || 10;

    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
}