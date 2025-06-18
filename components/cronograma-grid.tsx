"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"

interface CronogramaGridProps {
  data: {
    salas: string[]
    horarios: string[]
    aulas: {
      [sala: string]: {
        [horario: string]: {
          disciplina: string
          professor: string
          turma: string
        } | null
      }
    }
  }
}

export default function CronogramaGrid({ data }: CronogramaGridProps) {
  if (!data || !data.salas || !data.horarios || !data.aulas) {
    return (
      <div className="text-center py-8 text-gray-500">
        Dados do cronograma não disponíveis ou em formato incompatível.
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="overflow-x-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Horário</TableHead>
              {data.salas.map((sala) => (
                <TableHead key={sala}>{sala}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.horarios.map((horario) => (
              <TableRow key={horario}>
                <TableCell className="font-medium">{horario}</TableCell>
                {data.salas.map((sala) => {
                  const aula = data.aulas[sala]?.[horario]
                  return (
                    <TableCell key={`${sala}-${horario}`}>
                      {aula ? (
                        <motion.div
                          variants={item}
                          className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800"
                        >
                          <p className="font-medium text-blue-800 dark:text-blue-300">
                            Turma {aula.turma} - {aula.disciplina}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{aula.professor}</p>
                        </motion.div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
