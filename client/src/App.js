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
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/restaurant/requestwineform" element={<RequestWineForm />}/>
        <Route path="/user-view" element={<UserView />}/>
        <Route path="/admin/restaurantlist/add" element={<AddRestaurant />} />
        <Route path="/admin/restaurantlist" element={<RestaurantList />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/admin/wines" element={<WineLibrary />} />
        <Route path="/restaurant" element={<RestaurantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/wine-requests" element={<WineRequestReview />} />
        <Route path="/admin/wines/add" element={<AddWineForm />} />
      </Routes>
    </Router>
  );
}

export default App;
