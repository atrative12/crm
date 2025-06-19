import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigRules } from "@eslint/compat";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // Aplica as regras recomendadas para React, corrigindo a compatibilidade
  ...fixupConfigRules(pluginReactConfig), 
  {
    // Adiciona regras específicas para melhorar a experiência com React
    settings: {
      react: {
        version: "detect" // Detecta automaticamente a versão do React
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Desliga a necessidade de importar React em todos os arquivos
      "react/jsx-uses-react": "off",    // Mesma regra acima, para consistência
      "react/prop-types": "off"         // Desliga a necessidade de prop-types, já que usamos TypeScript
    }
  }
];