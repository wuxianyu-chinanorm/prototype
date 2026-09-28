import { Navigate, Route, Routes } from 'react-router-dom';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { ConsentScreen } from '../screens/ConsentScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MeScreen } from '../screens/MeScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { PassScreen } from '../screens/PassScreen';
import { QuestionnaireScreen } from '../screens/QuestionnaireScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

export function PhoneRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/pass" element={<PassScreen />} />
      <Route path="/today" element={<TodayScreen />} />
      <Route path="/consent" element={<ConsentScreen />} />
      <Route path="/questionnaire" element={<QuestionnaireScreen />} />
      <Route path="/result" element={<ResultScreen />} />
      <Route path="/checkout" element={<CheckoutScreen />} />
      <Route path="/schedule" element={<ScheduleScreen />} />
      <Route path="/diary" element={<DiaryScreen />} />
      <Route path="/messages" element={<MessagesScreen />} />
      <Route path="/me" element={<MeScreen />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
