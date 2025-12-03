import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderFilters, OrderStats, OrderStatus, CartItem } from '../types';
import { createDeliveryOrder, buildLalamoveConfig } from '../lib/lalamove';
import type { DeliveryOrderResult } from '../lib/lalamove';
import { useSiteSettings } from './useSiteSettings';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Admin password (should match server-side)
 */
const ADMIN_PASSWORD = 'Starrs@Admin!2025';

/**
 * Generate admin auth token from password
 * Must match server-side implementation
 */
function generateAdminToken(): string {
  // Simple token generation - matches server-side
  return btoa(ADMIN_PASSWORD);
}

/**
 * Get admin auth headers if admin is authenticated
 */
function getAdminHeaders(): Record<string, string> {
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('beracah_admin_auth') === 'true';
  if (isAdmin) {
    return {
      'X-Admin-Auth': generateAdminToken()
    };
  }
  return {};
}

interface CreateOrderOptions {
  address?: string;
  landmark?: string;
  pickupTime?: string;
  partySize?: number;
  dineInTime?: string;
  referenceNumber?: string;
  notes?: string;
  deliveryFee?: number;
  lalamoveQuotationId?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentFiltersRef = useRef<OrderFilters | undefined>(undefined);
  const { siteSettings } = useSiteSettings();
  const lalamoveConfig = buildLalamoveConfig(siteSettings);

  const normalizePhoneNumber = (phone?: string): string | undefined => {
    if (!phone) return undefined;
    const trimmed = phone.trim();
    if (!trimmed) return undefined;
    
    // Remove all non-digits
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return undefined;
    
    // Always normalize to +63 format
    if (digits.startsWith('63')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      // Remove leading 0 and add 63
      return `+63${digits.slice(1)}`;
    } else if (digits.startsWith('9')) {
      // Add 63 prefix
      return `+63${digits}`;
    } else {
      // Add 63 prefix for any other format
      return `+63${digits}`;
    }
  };

  const fetchOrders = useCallback(async (filters?: OrderFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.service_type) params.append('service_type', filters.service_type);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `/api/orders${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          ...getAdminHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch orders' }));
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      currentFiltersRef.current = filters;
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function is stable

  const fetchOrderById = async (id: string): Promise<Order | null> => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          ...getAdminHeaders()
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch order' }));
        throw new Error(errorData.error || 'Failed to fetch order');
      }

      const data = await response.json();
      return data.order || null;
    } catch (err) {
      console.error('Error fetching order:', err);
      throw err;
    }
  };

  const createOrder = async (
    cartItems: CartItem[],
    customerName: string,
    contactNumber: string,
    serviceType: 'dine-in' | 'pickup' | 'delivery',
    paymentMethod: string,
    total: number,
    options?: CreateOrderOptions
  ): Promise<Order> => {
    try {
      // Create order via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          cartItems,
          customerName,
          contactNumber,
          serviceType,
          paymentMethod,
          total,
          options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create order' }));
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      let order = data.order;

      // Handle Lalamove delivery order creation if needed
      if (
        serviceType === 'delivery' &&
        options?.lalamoveQuotationId &&
        lalamoveConfig
      ) {
        try {
          const normalizedRecipientPhone = normalizePhoneNumber(contactNumber) || contactNumber;
          const lalamoveOrderResult: DeliveryOrderResult = await createDeliveryOrder(
            options.lalamoveQuotationId,
            customerName,
            normalizedRecipientPhone,
            lalamoveConfig,
            {
              orderId: order.id,
              deliveryAddress: options?.address,
              deliveryLat: options?.deliveryLat,
              deliveryLng: options?.deliveryLng,
            }
          );

          // Update order with Lalamove info via API
          if (lalamoveOrderResult) {
            await fetch(`/api/orders/${order.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...getAdminHeaders(),
              },
              body: JSON.stringify({
                status: order.status, // Keep current status
                lalamove_order_id: lalamoveOrderResult.orderId,
                lalamove_status: lalamoveOrderResult.status,
                lalamove_tracking_url: lalamoveOrderResult.shareLink,
              }),
            });

            // Update local order object
            order = {
              ...order,
              lalamove_order_id: lalamoveOrderResult.orderId,
              lalamove_status: lalamoveOrderResult.status,
              lalamove_tracking_url: lalamoveOrderResult.shareLink,
            };
          }
        } catch (orderError) {
          console.error('Failed to create Lalamove order:', orderError);
          // Don't fail the entire order creation if Lalamove fails
        }
      }

      // Refresh orders list
      await fetchOrders(currentFiltersRef.current);

      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update order' }));
        throw new Error(errorData.error || 'Failed to update order');
      }

      // Refresh orders list (non-blocking - don't wait for it)
      fetchOrders(currentFiltersRef.current).catch(err => {
        console.error('Error refreshing orders after update:', err);
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: OrderStatus): Promise<void> => {
    try {
      const response = await fetch('/api/orders/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ ids, status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update orders' }));
        throw new Error(errorData.error || 'Failed to update orders');
      }

      // Refresh orders list (non-blocking - don't wait for it)
      fetchOrders(currentFiltersRef.current).catch(err => {
        console.error('Error refreshing orders after bulk update:', err);
      });
    } catch (err) {
      console.error('Error bulk updating order status:', err);
      throw err;
    }
  };

  const getOrderStats = async (): Promise<OrderStats> => {
    try {
      const response = await fetch('/api/orders/stats', {
        headers: {
          ...getAdminHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      return data.stats;
    } catch (err) {
      console.error('Error fetching order stats:', err);
      throw err;
    }
  };

  // Set up real-time subscription for live updates
  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    if (isMounted) {
      fetchOrders();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (!isMounted) return;
          console.log('Order change received:', payload.eventType, payload.new);
          
          // Refetch orders to get updated data with order_items
          if (currentFiltersRef.current) {
            await fetchOrders(currentFiltersRef.current);
          } else {
            await fetchOrders();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        async (payload) => {
          if (!isMounted) return;
          console.log('Order item change received:', payload.eventType);
          
          // Refetch orders when order items change
          if (currentFiltersRef.current) {
            await fetchOrders(currentFiltersRef.current);
          } else {
            await fetchOrders();
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - fetchOrders is stable

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrderStatus,
    bulkUpdateStatus,
    getOrderStats,
    refetch: () => fetchOrders(currentFiltersRef.current)
  };
};
