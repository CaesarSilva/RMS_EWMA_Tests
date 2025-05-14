# RMS_EWMA_Tests
Tests using EWMA for RMS measurement in alternating current.


## Informações  
Os testes consistiram em modificar o código a cada teste, por ser mais rápido do que criar um programa completo com prompts perguntando o quê fazer.  
O arquivo detection.js é o arquivo principal, durante o teste salvei cópias na pasta testes.  
O programa consiste em simular 3 ondas senoidais, que representam tensão ou corrente de 3 fases, utilizar a EWMA para calcular a média móvel, e plotar essa média móvel comparado com o modelo de equação diferencial que foi calculado.  
O motivo de se modelar uma equação diferencial era apenas ter previsibilidade para poder interpretar de forma mais precisa a média móvel calculada. E o programa simula faltas durante um período onde a amplitude é multiplicada por um número, simulado por exemplo uma situação de subtensão ou sobrecorrente, e o restante do código calcula a EWMA, e utiliza os setpoints de detecção para detectar uma anormalidade, para isso é considerada a amplitude do ruído que foi calculada resolvendo a equação diferencial.
O modelo de equação diferencial é aproximado, está sujeito a erros, além de sofrer influência de harmônicos. O objetivo desse programa é visualizar a performace desse método de forma matemática sem fazer experimentos reais, visto que o trabalho é referente apenas a performace do método, e não dos dispositivos, como por exemplo arduino, que poderiam influenciar no teste.  
Testes preliminares mostraram que é possível calcular EWMA no arduino numa onda de 60Hz utilizando 16 amostras por segundo, porém esses mesmos testes revelaram problemas relacionado a limitação da amostragem do arduino, e tempo de processamento e atraso nas amostragens que podem induzir ao erro.
