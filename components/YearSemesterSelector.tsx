import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface YearSemesterSelectorProps {
  selectedYear: number;
  selectedSemester: number;
  onYearChange: (year: number) => void;
  onSemesterChange: (semester: number) => void;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
  placeholder: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={selectRef} className="relative">
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full appearance-none bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl px-4 py-3 pr-10 text-left text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-white/50 hover:bg-white/30 dark:hover:bg-white/15"
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] w-full mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-xl shadow-2xl overflow-visible"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-all duration-150 ${
                    option.value === value
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/10'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ x: 4 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const YearSemesterSelector: React.FC<YearSemesterSelectorProps> = ({
  selectedYear,
  selectedSemester,
  onYearChange,
  onSemesterChange,
  disabled = false,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const semesters = [1, 2, 3, 4];

  const yearOptions = years.map(year => ({
    value: year,
    label: year.toString()
  }));

  const semesterOptions = semesters.map(semester => ({
    value: semester,
    label: `${semester}º Semestre`
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-visible border border-white/20 p-8"
    >
      <div className="flex items-center mb-6">
        <div className="bg-blue-500/20 p-2 rounded-xl mr-3">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Período Acadêmico
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Year Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ano Letivo
          </label>
          <CustomSelect
            value={selectedYear}
            onChange={onYearChange}
            options={yearOptions}
            placeholder="Selecione o ano"
            disabled={disabled}
          />
        </div>

        {/* Semester Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Período
          </label>
          <CustomSelect
            value={selectedSemester}
            onChange={onSemesterChange}
            options={semesterOptions}
            placeholder="Selecione o semestre"
            disabled={disabled}
          />
        </div>
      </div>
    </motion.div>
  );
};