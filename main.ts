chassis.setMotors(motors.mediumB, motors.mediumC, true, false); // Установка моторов шасси
chassis.setSyncRegulatorGains(0.02, 0.0001, 0.5); // Установка коэффицентов синхронизации моторов
chassis.setWheelDiametr(62.4); // Установка диаметра колёс
chassis.setBaseLength(180); // Установка расстония между центрами колёс

sensors.setNxtLightSensorsAsLineSensors(sensors.nxtLight2, sensors.nxtLight3); // Установка датчиков отражения в качестве датчиков линии
sensors.setLineSensorsRawRefValues(2028, 1304, 2328, 1600); // Установка калибровочных значений отражения для нормализации отражения

motions.setDistRollingAfterIntersection(60); // Установка расстояния прокатки после опредления перекрёстка при движении по линии
motions.setMinPwrAtEndMovement(30); // Установка минимальной скорости при завершении движений

motions.setLineFollowLoopDt(1); // Установить время регулирования движения по линии

const manipulatorMotor = motors.mediumA; // Переменная объекта мотора манипулятора
const unloadingMechanismMotor = motors.mediumD; // Переменная объекта мотора механизма сроса кубиков

const colorSensor = sensors.color4; // Установка датчика цвета определяющий цвет кубика

sensors.setColorSensorMinRgbValues(colorSensor, 10, 10, 10); // Значения датчика цвета когда ничего нет
sensors.setColorSensorMaxRgbValues(colorSensor, 108, 108, 109); // Значения датчика цвета для белоо кубика
sensors.setHsvlToColorNumParams(colorSensor, {
    colorBoundary: 50,
    whiteBoundary: 4,
    blackBoundary: 1,
    redBoundary: 98,
    brownBoundary: 99,
    yellowBoundary: 100,
    greenBoundary: 180,
    blueBoundary: 270
}); // Установить границы преобразования hsvl в цветовые коды

navigation.setNodesNumber(9); // Количество узловых точек, используем не все

// Массив смежностей направлений
navigation.setNavigationMatrix([
    [-1, 0, -1, -1, -1, -1, -1, -1, -1],
    [2, -1, 0, -1, -1, -1, -1, -1, -1],
    [-1, 2, -1, 0, -1, -1, -1, -1, -1],
    [-1, -1, 2, -1, 1, -1, -1, -1, -1],
    [-1, -1, -1, 3, -1, 1, -1, -1, -1],
    [-1, -1, -1, -1, 3, -1, 1, -1, -1],
    [-1, -1, -1, -1, -1, 3, -1, 1, -1],
    [-1, -1, -1, -1, -1, -1, 3, -1, 1],
    [-1, -1, -1, -1, -1, -1, -1, 3, -1]
]);

// Массив смежности весов
navigation.setWeightMatrix([
    [-1, 1, -1, -1, -1, -1, -1, -1, -1],
    [1, -1, 1, -1, -1, -1, -1, -1, -1],
    [-1, 1, -1, 1, -1, -1, -1, -1, -1],
    [-1, -1, 1, -1, 1, -1, -1, -1, -1],
    [-1, -1, -1, 1, -1, 1, -1, -1, -1],
    [-1, -1, -1, -1, 1, -1, 1, -1, -1],
    [-1, -1, -1, -1, -1, 1, -1, 1, -1],
    [-1, -1, -1, -1, -1, -1, 1, -1, 1],
    [-1, -1, -1, -1, -1, -1, -1, 1, -1]
]);

let colors: number[] = []; // Массив, чтобы сохранить цвета кубиков

// Проверка цвета
function CheckColor(time: number): number {
    let colorSamples: number[] = [];
    control.timer1.reset();
    let prevTime = control.millis();
    while (control.timer1.millis() < time) {
        const currTime = control.millis();
        const dt = currTime - prevTime;
        prevTime = currTime;
        const rgb = sensors.getNormalizeRgb(colorSensor);
        const hsvl = sensors.convertRgbToHsvl(rgb);
        const color = sensors.convertHsvlToColorNum(hsvl, sensors.getHsvlToColorNumParams(colorSensor));
        colorSamples.push(color);
        control.pauseUntilTime(currTime, 10);
    }
    const colorResult = custom.mostFrequentNumber(colorSamples);
    return colorResult;
}

// Манипулятор захвата
function Manipulator(state: ManipulatorState, hold: boolean, v: number = 50) {
    const dir = state == ManipulatorState.Down ? 1 : -1;
    manipulatorMotor.run(Math.abs(v) * dir);
    pause(10);
    manipulatorMotor.pauseUntilStalled();
    manipulatorMotor.setBrake(hold);
    manipulatorMotor.stop();
}

// Механизм сброса
function UnloadingMechanism(state: UnloadingMechanismState, hold: boolean, v: number = 30) {
    const dir = state == UnloadingMechanismState.Down ? 1 : -1;
    unloadingMechanismMotor.run(Math.abs(v) * dir);
    pause(10);
    unloadingMechanismMotor.pauseUntilStalled();
    unloadingMechanismMotor.setBrake(hold);
    unloadingMechanismMotor.stop();
}

// Озвучить цвет
function VoiceColor(color: number) {
    if (color == 1) music.playSoundEffect(sounds.colorsBlack);
    if (color == 2) music.playSoundEffect(sounds.colorsBlue);
    else if (color == 3) music.playSoundEffect(sounds.colorsGreen);
    else if (color == 4) music.playSoundEffect(sounds.colorsYellow);
    else if (color == 5) music.playSoundEffect(sounds.colorsRed);
    else if (color == 6) music.playSoundEffect(sounds.colorsWhite);
    else music.playSoundEffect(sounds.communicationNo);
}

// Функция для одного ряда кубиков
function CubeRow(firstCube: number, secondCube: number) {
    CubeCapture(firstCube); // Захватываем ближний кубик
    pause(50);
    chassis.linearDistMove(110, 50, MotionBraking.Hold); // Подъезжаем к дальнему кубику
    pause(50);
    CubeCapture(secondCube); // Захватываем дальний кубик
}

// Функция захвата и определение одного кубика
function CubeCapture(cubeNumber: number) {
    Manipulator(ManipulatorState.Up, true, 50); // Манипулятор поднять для захвата N-го кубика
    colors.push(CheckColor(500)); // Запрашиваем и сохраняем цвет в массив
    brick.printValue(`color${cubeNumber + 1}`, colors[cubeNumber], cubeNumber + 1); // Выводим на экран цвет N-го кубика
    VoiceColor(colors[cubeNumber]); // Озвучиваем цвет N-го кубика
    Manipulator(ManipulatorState.Down, true, 50); // Отпускаем манипулятор после определения цвета кубика
}

// Функция, для возвращения к перекрёстку ряда кубиков
function ReturnToCrossRowCubes() {
    chassis.linearDistMove(-20, 60, MotionBraking.Hold); // Отъезжаем назад на линию
    pause(50);
    chassis.spinTurn(180, 70); // Поворачиваемся
    pause(50);
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling); // Движемся до перекрёстка
    pause(50);
}

// Главная функция решения задачи
function Main() {
    manipulatorMotor.setInverted(true); // Включить реверс мотора манипулятора
    unloadingMechanismMotor.setInverted(true); // Включить реверс мотора механизма сброса
    Manipulator(ManipulatorState.Down, true, 40); // Предустановить манипулятор в положение раскрытия
    UnloadingMechanism(UnloadingMechanismState.Up, true, 10); // Предустановить механизм сброса в положение закрыт
    for (let i = 0; i < 10; i++) { // Опрос датчиков, чтобы те включились
        sensors.getNormalizedReflectionValue(LineSensor.Left);
        sensors.getNormalizedReflectionValue(LineSensor.Right);
        colorSensor.rgbRaw();
        pause(5);
    }
    brick.printString("RUN", 7, 13);
    brick.buttonEnter.pauseUntil(ButtonEvent.Pressed); // Ожидание нажатие кнопки
    brick.clearScreen(); // Очистить экран

    // Чтобы найти мин и макс датчика цвета
    // brick.buttonEnter.pauseUntil(ButtonEvent.Released);
    // sensors.searchRgbMinMax(colorSensor);

    // Цвета для проверки
    // while (true) {
    //     const color = CheckColor(50);
    //     brick.printValue("color", color, 1);
    //     pause(10);
    // }

    chassis.accelStartLinearDistMove(30, 80, 100, 100); // Плавный старт с стартовой зоны
    for (let i = 0; i < 3; i++) {  // Движемся по линии и проходим три перекрёстка без остановки
        motions.lineFollowToCrossIntersection(AfterLineMotion.LineContinueRoll, { v: 80, Kp: 0.3, Kd: 0.5 });
    }
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling); // На следующем перекрёстке останавливаемся
    pause(50);

    chassis.spinTurn(-90, 70); // Поворачиваемся влево к зонам с кубиками
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 60, Kp: 0.3, Kd: 0.5  }); // Проезжаем ещё перекрёсток
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваемся вправо к кубикам
    pause(50);
    motions.rampLineFollowToDistanceByTwoSensors(150, 50, 70, MotionBraking.Hold, { vStart: 30, vMax: 60, vFinish: 20, Kp: 0.3, Kd: 0.5 }); // Подъезжаем плавно к 1 кубику

    CubeRow(0, 1); // Захватываем первый ряд кубиков (1 и 2 кубики)
    console.log(`colors: ${colors.join(", ")}`); // Записываем в консоль все цвета 4х кубиков

    ReturnToCrossRowCubes(); // Возвращаемся к перекрёстку ряда кубиков

    // Двигаемся ко второму ряду кубиков
    chassis.spinTurn(90, 70); // Поворачиваемся ко 2 ряду с кубиками
    pause(50);
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 60, Kp: 0.3, Kd: 0.5 }); // Двигаемся к перекрёстку 2 ряда кубиков
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваемся вправо к 3 и 4 кубику
    pause(50);
    motions.rampLineFollowToDistanceByTwoSensors(150, 50, 70, MotionBraking.Hold); // Подъезжаем плавно к 3 кубику

    CubeRow(2, 3); // Захватываем второй ряд кубиков (3 и 4 кубики)
    console.log(`colors: ${colors.join(", ")}`); // Записываем в консоль все цвета 4х кубиков
    
    ReturnToCrossRowCubes(); // Возвращаемся к перекрёстку ряда кубиков

    // Двигаемся к перекрёстку / вершине 3
    chassis.spinTurn(-90, 70); // Поворачиваемся влево
    pause(50);
    motions.lineFollowToCrossIntersection(AfterLineMotion.LineContinueRoll, { v: 60, Kp: 0.3, Kd: 0.5 });
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 60 });
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваем вправо

    navigation.setCurrentPositon(3); // Установить позицию перекрёстка для навигации
    navigation.setCurrentDirection(2); // Установить направление на перекрёстке для навигации

    // brick.buttonEnter.pauseUntil(ButtonEvent.Pressed); // Ждём нажатия для продолжения

    let targetPos = -1; // Переменная для хранения позиции, в которую нужно приехать

    // Цикл, чтобы отвезти 4 кубика
    for (let i = 0; i < 4; i++) {
        const startMovementPos = navigation.getCurrentPositon(); // Стартовая позиция движения

        if (colors[i] == 2) targetPos = 2; // Синий
        else if (colors[i] == 3) targetPos = 1; // Зелёный
        else if (colors[i] == 5) targetPos = 0; // Красный
        // Иначе позиция предыдущего сброшеного кубика
        console.log(`targetPos: ${targetPos}`); // Вывести в консоль целевую позицию выгрузки кубика

        const path = navigation.algorithmBFS(startMovementPos, targetPos); // Находим и сохраняем путь
        console.log(`path${i}: ${path.join(", ")}`); // Записывае в консоль найденный путь

        // Доехать до точки
        navigation.followLineByPath(path, { moveStartV: 30, moveMaxV: 70, turnV: 70, Kp: 0.3, Kd: 0.5 });
        pause(50);

        if (startMovementPos >= 3 || startMovementPos > targetPos) chassis.spinTurn(90, 70); // Повернуться к перекрёстку
        else if (startMovementPos < targetPos) chassis.spinTurn(-90, 70); // Повернуться к точке, находясь на 0 или 1 точке
        else chassis.spinTurn(180, 70); // Тот же самый цвет, а это значит повернуться жопкой

        navigation.setCurrentPositon(targetPos); // Сохраняем в каком месте мы теперь находимся, а вроде даже не нужно это!

        // Снизу с перекрёстков доехать до мест сброса
        motions.rampLineFollowToDistanceByTwoSensors(100, 50, 50, MotionBraking.Hold, { vStart: 30, vMax: 60, vFinish: 20, Kp: 0.3, Kd: 0.5 }); // Плано по линии
        pause(50);
        chassis.spinTurn(180, 70); // Повернуться жопкой
        pause(50);
        chassis.linearDistMove(-50, 60, MotionBraking.Hold); // Немного назад жопкой

        // Сброс кубика
        UnloadingMechanism(UnloadingMechanismState.Down, false);
        pause(100);
        UnloadingMechanism(UnloadingMechanismState.Up, true);

        motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 70, Kp: 0.3, Kd: 0.5 }); // Двигаемся обратно до вершины
        navigation.setCurrentDirection(3); // Устанавливаем в какое направление мы теперь повёрнуты
        music.playSoundEffectUntilDone(sounds.communicationGo); // Чисто тест, что дальше идёт продолжение
    }


    //// ДАЛЬШЕ
    // Движемся до перекрёстка/вершины 3
    motions.rampLineFollowToDistanceByTwoSensors(450, 100, 100, MotionBraking.Continue, { vStart: 30, vMax: 80, vFinish: 70, Kp: 0.3, Kd: 0.5 }) // Движемся на расстояние
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 70, Kp: 0.3, Kd: 0.5 }); // На следующем перекрёстке останавливаемся
    pause(50);
    chassis.spinTurn(-90, 70); // Поворачиваемся влево к зонам с кубиками
    motions.lineFollowToCrossIntersection(AfterLineMotion.LineContinueRoll, { v: 60, Kp: 0.3, Kd: 0.5 }); // Проезжаем ещё перекрёсток
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling); // Проезжаем ещё перекрёсток
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваемся вправо к кубикам
    pause(50);
    motions.rampLineFollowToDistanceByTwoSensors(150, 50, 70, MotionBraking.Hold, { vStart: 30, vMax: 60, vFinish: 20, Kp: 0.3, Kd: 0.5 }); // Подъезжаем плавно к 1 кубику

    CubeRow(4, 5); // Захватываем второй ряд кубиков (5 и 6 кубики)
    console.log(`colors: ${colors.join(", ")}`); // Записываем в консоль все цвета 4х кубиков

    ReturnToCrossRowCubes(); // Возвращаемся к перекрёстку ряда кубиков

    // Двигаемся ко второму ряду кубиков
    chassis.spinTurn(90, 70); // Поворачиваемся ко 2 ряду с кубиками
    pause(50);
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 60, Kp: 0.3, Kd: 0.5 }); // Двигаемся к перекрёстку 2 ряда кубиков
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваемся вправо к 3 и 4 кубику
    pause(50);
    motions.rampLineFollowToDistanceByTwoSensors(150, 50, 70, MotionBraking.Hold); // Подъезжаем плавно к 3 кубику

    CubeRow(6, 7); // Захватываем второй ряд кубиков (7 и 8 кубики)
    console.log(`colors: ${colors.join(", ")}`); // Записываем в консоль все цвета 4х кубиков

    ReturnToCrossRowCubes(); // Возвращаемся к перекрёстку ряда кубиков

    // Двигаемся к перекрёстку / вершине 3
    chassis.spinTurn(-90, 70); // Поворачиваемся влево
    pause(50);
    for (let i = 0; i < 2; i++) {
        motions.lineFollowToCrossIntersection(AfterLineMotion.LineContinueRoll, { v: 60, Kp: 0.3, Kd: 0.5 });
    }
    motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 60 });
    pause(50);
    chassis.spinTurn(90, 70); // Поворачиваем вправо

    navigation.setCurrentPositon(3); // Установить позицию перекрёстка для навигации
    navigation.setCurrentDirection(2); // Установить направление на перекрёстке для навигации

    // brick.buttonEnter.pauseUntil(ButtonEvent.Pressed); // Ждём нажатия для продолжения

    targetPos = -1; // Переменная для хранения позиции, в которую нужно приехать

    // Цикл, чтобы отвезти 4 кубика
    for (let i = 4; i < 8; i++) {
        const startMovementPos = navigation.getCurrentPositon(); // Стартовая позиция движения

        if (colors[i] == 2) targetPos = 2; // Синий
        else if (colors[i] == 3) targetPos = 1; // Зелёный
        else if (colors[i] == 5) targetPos = 0; // Красный
        // Иначе позиция предыдущего сброшеного кубика
        console.log(`targetPos: ${targetPos}`); // Вывести в консоль целевую позицию выгрузки кубика

        const path = navigation.algorithmBFS(startMovementPos, targetPos); // Находим и сохраняем путь
        console.log(`path${i}: ${path.join(", ")}`); // Записывае в консоль найденный путь

        // Доехать до точки
        navigation.followLineByPath(path, { moveStartV: 30, moveMaxV: 70, turnV: 70, Kp: 0.3, Kd: 0.5 });
        pause(50);

        if (startMovementPos >= 3 || startMovementPos > targetPos) chassis.spinTurn(90, 70); // Повернуться к перекрёстку
        else if (startMovementPos < targetPos) chassis.spinTurn(-90, 70); // Повернуться к точке, находясь на 0 или 1 точке
        else chassis.spinTurn(180, 70); // Тот же самый цвет, а это значит повернуться жопкой

        navigation.setCurrentPositon(targetPos); // Сохраняем в каком месте мы теперь находимся, а вроде даже не нужно это!

        // Снизу с перекрёстков доехать до мест сброса
        motions.rampLineFollowToDistanceByTwoSensors(100, 50, 50, MotionBraking.Hold, { vStart: 30, vMax: 60, vFinish: 20, Kp: 0.3, Kd: 0.5 }); // Плано по линии
        pause(50);
        chassis.spinTurn(180, 70); // Повернуться жопкой
        pause(50);
        chassis.linearDistMove(-50, 60, MotionBraking.Hold); // Немного назад жопкой

        // Сброс кубика
        UnloadingMechanism(UnloadingMechanismState.Down, false);
        pause(100);
        UnloadingMechanism(UnloadingMechanismState.Up, true);

        motions.lineFollowToCrossIntersection(AfterLineMotion.SmoothRolling, { v: 70, Kp: 0.3, Kd: 0.5 }); // Двигаемся обратно до вершины
        navigation.setCurrentDirection(3); // Устанавливаем в какое направление мы теперь повёрнуты
        music.playSoundEffectUntilDone(sounds.communicationGo); // Чисто тест, что дальше идёт продолжение
    }

    //// ДАЛЬШЕ
    // Едем домой с перекрёсток / вершин 0 или 1 или 2!!!
    chassis.spinTurn(90, 70); // Поворачиваемся от стенки вправо
    motions.rampLineFollowToDistanceByTwoSensors(500, 100, 100, MotionBraking.Continue, { vStart: 30, vMax: 80, vFinish: 60, Kp: 0.3, Kd: 0.5 }) // Движемся на расстояние
    motions.lineFollowToCrossIntersection(AfterLineMotion.NoStop, { v: 60, Kp: 0.3, Kd: 0.5 }); // Движемся до линии (перекрёстка) базы
    chassis.decelFinishLinearDistMove(60, 30, 170, 100, AfterMotion.HoldStop); // Заезжаем в базу плавным замедлением
    music.playSoundEffectUntilDone(sounds.communicationGameOver); // Издаём звук завершения
}

Main(); // Запуск главной функции