import { createRouter, createWebHistory } from 'vue-router'
import EndpointsView from '../views/EndpointsView.vue'
import EventsView from '../views/EventsView.vue'
import DeliveriesView from '../views/DeliveriesView.vue'
import DeliveryDetailView from '../views/DeliveryDetailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/endpoints',
    },
    {
      path: '/endpoints',
      name: 'endpoints',
      component: EndpointsView,
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView,
    },
    {
      path: '/deliveries',
      name: 'deliveries',
      component: DeliveriesView,
    },
    {
      path: '/deliveries/:id',
      name: 'delivery-detail',
      component: DeliveryDetailView,
    },
  ],
})

export default router
