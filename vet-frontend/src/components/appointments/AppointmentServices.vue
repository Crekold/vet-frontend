<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Servicios Médicos</h3>

    <!-- Selección de servicios -->
    <div v-if="!isReadOnly" class="mb-6">
      <div class="flex space-x-2 mb-4">
        <select
          v-model="selectedService"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
        >
          <option value="" disabled>Seleccionar servicio</option>
          <option 
            v-for="service in availableServices" 
            :key="service.id" 
            :value="service"
          >
            {{ service.nombre }} - {{ formatPrice(service.precio) }}
          </option>
        </select>
        <input
          type="number"
          v-model.number="cantidad"
          min="1"
          class="block w-24 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          placeholder="Cant."
        />
        <button
          @click="addService"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          :disabled="!selectedService || cantidad < 1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Agregar
        </button>
      </div>
    </div>

    <!-- Lista de servicios seleccionados -->
    <div v-if="isLoading" class="py-4 flex justify-center">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
      <span class="ml-2 text-gray-500">Cargando servicios...</span>
    </div>

    <div v-else-if="citaServicios.length === 0" class="py-4 text-center text-gray-500">
      <p>No hay servicios asignados a esta cita.</p>
    </div>

    <div v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th v-if="!isReadOnly" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in citaServicios" :key="`${item.citaId}-${item.servicioId}`">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ item.nombreServicio }}</div>
                <div class="text-xs text-gray-500">{{ item.descripcionServicio }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatPrice(item.precioUnitario) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="isReadOnly" class="text-sm text-gray-900">{{ item.cantidad }}</div>
                <input
                  v-else
                  type="number"
                  v-model.number="item.cantidad"
                  min="1"
                  @change="updateServiceQuantity(item)"
                  class="text-sm w-20 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ formatPrice(item.precioTotal) }}</div>
              </td>
              <td v-if="!isReadOnly" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="removeService(item)"
                  type="button"
                  class="text-red-600 hover:text-red-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td class="px-6 py-3 text-right text-sm font-medium text-gray-900" colspan="3">Total:</td>
              <td class="px-6 py-3 text-left text-sm font-bold text-gray-900">
                {{ formatPrice(totalAmount) }}
              </td>
              <td v-if="!isReadOnly"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue';
// Importar funciones nombradas de citaServicioService
import {
  getServiciosByCita,
  addServicioToCita,
  updateServicioInCita,
  removeServicioFromCita
} from '../../services/citaServicioService';
// Importar el servicio dedicado para servicios médicos
import serviceService from '../../services/serviceService';

const props = defineProps({
  citaId: {
    type: [Number, String],
    required: true
  },
  isReadOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:services']);

// Estado
const availableServices = ref([]);
const citaServicios = ref([]);
const selectedService = ref('');
const cantidad = ref(1);
const isLoading = ref(false);

// Calcular total
const totalAmount = computed(() => {
  // Asegurarse de que item.precioTotal es un número
  return citaServicios.value.reduce((sum, item) => sum + (Number(item.precioTotal) || 0), 0);
});

// Formatear precio
const formatPrice = (price) => {
  const numericPrice = Number(price);
  // Devolver un string vacío o un placeholder si no es un número válido
  if (isNaN(numericPrice)) {
    return '$ --'; // O '$ 0' o lo que prefieras
  }
  return `$${numericPrice.toLocaleString('es-CL')}`;
};

// Cargar servicios disponibles
const loadAvailableServices = async () => {
  try {
    // Usar el servicio dedicado
    const services = await serviceService.getAllServices();
    availableServices.value = Array.isArray(services) ? services : [];
  } catch (error) {
    console.error('Error al cargar servicios disponibles:', error);
    availableServices.value = []; // Limpiar en caso de error
  }
};

// Cargar servicios de la cita
const loadCitaServicios = async () => {
  if (!props.citaId) return;

  isLoading.value = true;

  try {
    const services = await getServiciosByCita(props.citaId);

    citaServicios.value = (Array.isArray(services) ? services : []).map(citaServicio => {
      const servicioAnidado = citaServicio.servicio || {};
      const cantidadNum = Number(citaServicio.cantidad) || 1;
      const precioUnitarioNum = Number(servicioAnidado.precio ?? citaServicio.precioUnitario) || 0;

      const processedService = {
        ...citaServicio,
        nombreServicio: servicioAnidado.nombre ?? citaServicio.nombreServicio ?? 'Servicio Desconocido',
        descripcionServicio: servicioAnidado.descripcion ?? citaServicio.descripcionServicio ?? '',
        precioUnitario: precioUnitarioNum,
        cantidad: cantidadNum,
        precioTotal: precioUnitarioNum * cantidadNum,
      };
      return processedService;
    });
    emit('update:services', citaServicios.value);
  } catch (error) {
    console.error(`Error al cargar servicios de la cita ${props.citaId}:`, error);
    citaServicios.value = [];
    emit('update:services', citaServicios.value);
  } finally {
    isLoading.value = false;
  }
};

// Agregar servicio a la cita
const addService = async () => {
  // Asegurarse de que selectedService y su precio existen y son números
  if (!selectedService.value || isNaN(Number(selectedService.value.precio)) || cantidad.value < 1) return;

  const service = selectedService.value;
  const unitPrice = Number(service.precio);
  const quantity = Number(cantidad.value);
  const precioTotal = unitPrice * quantity;

  const citaServicioData = {
    citaId: props.citaId,
    servicioId: service.id,
    cantidad: quantity,
    nombreServicio: service.nombre,
    descripcionServicio: service.descripcion || '',
    precioUnitario: unitPrice,
    precioTotal: precioTotal
  };

  try {
    // Usar función importada
    await addServicioToCita(citaServicioData);
    await loadCitaServicios(); // Recargar la lista

    // Resetear selección
    selectedService.value = '';
    cantidad.value = 1;
  } catch (error) {
    console.error('Error al agregar servicio a la cita:', error);
  }
};

// Actualizar cantidad de servicio
const updateServiceQuantity = async (item) => {
  // Asegurarse de que la cantidad y el precio unitario son números
  const quantity = Number(item.cantidad);
  const unitPrice = Number(item.precioUnitario);

  if (isNaN(quantity) || quantity < 1 || isNaN(unitPrice)) {
    // Si la cantidad no es válida, recargar para revertir
    console.warn("Cantidad o precio unitario inválido detectado. Recargando servicios.");
    await loadCitaServicios();
    return;
  }

  // Calcular nuevo precio total
  item.cantidad = quantity; // Asegurar que la cantidad guardada es numérica
  item.precioTotal = unitPrice * quantity;

  try {
    // Usar función importada
    await updateServicioInCita(item);
    emit('update:services', citaServicios.value);
  } catch (error) {
    console.error('Error al actualizar cantidad del servicio:', error);
    // Recargar para obtener datos correctos en caso de error
    await loadCitaServicios();
  }
};

// Eliminar servicio de la cita
const removeService = async (item) => {
  try {
    // Usar función importada
    await removeServicioFromCita(props.citaId, item.servicioId);
    await loadCitaServicios(); // Recargar la lista
  } catch (error) {
    console.error('Error al eliminar servicio de la cita:', error);
  }
};

// Inicializar
onMounted(() => {
  loadAvailableServices();
  loadCitaServicios();
});

// Actualizar cuando cambie la cita
watch(() => props.citaId, (newId) => {
  if (newId) {
    loadCitaServicios();
  }
});
</script>
