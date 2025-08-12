// client/src/App.js
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import SignIn from "./components/SignIn";
import WineLibrary from "./components/WineLibrary";
import RestaurantDashboard from "./components/RestaurantDashboard";
import AdminDashboard from "./components/AdminDashboard";
import WineRequestReview from "./components/WineRequestReview";
import AddWineForm from "./components/AddWineForm";
import RestaurantList from "./components/RestaurantList";
import AddRestaurant from "./components/AddRestaurant";
import UserView from "./components/UserView";
import RequestWineForm from "./components/RequestWineForm";
import RestaurantLibrary from "./components/RestaurantLibrary";
import ProtectedRoute from "./components/ProtectedRoute";
import AssignWineImage from "./components/AssignWineImage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/admin/assign-image" element={<ProtectedRoute role="admin"><AssignWineImage /></ProtectedRoute>} />
        <Route path="/admin/restaurantlibrary/:id" element={<ProtectedRoute role="admin"><RestaurantLibrary /></ProtectedRoute>} />
        <Route path="/admin/restaurantlibrary" element = {<ProtectedRoute role="admin"><RestaurantLibrary /></ProtectedRoute>}/>
        <Route path="/restaurant/requestwineform" element={<ProtectedRoute role="restaurant"><RequestWineForm /></ProtectedRoute>}/>        
        <Route path="/admin/restaurantlist/add" element={<ProtectedRoute role="admin"><AddRestaurant /></ProtectedRoute>} />
        <Route path="/admin/restaurantlist" element={<ProtectedRoute role="admin"><RestaurantList /></ProtectedRoute>} />
        <Route path="/admin/wines" element={<ProtectedRoute role="admin"><WineLibrary /></ProtectedRoute>} />
        <Route path="/restaurant" element={  <ProtectedRoute role="restaurant"><RestaurantDashboard /></ProtectedRoute>}/>
        <Route path="/admin" element={ <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/wine-requests" element={<ProtectedRoute role="admin"><WineRequestReview /></ProtectedRoute>} />
        <Route path="/admin/wines/add" element={<ProtectedRoute role="admin"><AddWineForm /></ProtectedRoute>} />
        <Route path="/user-view/:id" element={<UserView />}/>
        <Route path="/user-view" element={<ProtectedRoute role="admin"><UserView /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
