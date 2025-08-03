const API_BASE_URL = import.meta.env.VITE_SEVER_URL;

export interface Worker {
  _id: string;
  fullName: string;
  walletAddress: string;
  email: string;
  label: string;
  savedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerData {
  fullName: string;
  walletAddress: string;
  email: string;
  label: string;
  savedBy: string;
  isActive: boolean;
}

export interface UpdateWorkerData {
  fullName?: string;
  walletAddress?: string;
  email?: string;
  label?: string;
  savedBy?: string;
  isActive?: boolean;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          url,
          body: options.body,
          errorData
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Create a new worker contact
  async createWorker(
    workerData: CreateWorkerData
  ): Promise<{ data: Worker; message: string }> {
    console.log("Sending worker data:", workerData);
    return this.makeRequest("", {
      method: "POST",
      body: JSON.stringify(workerData),
    });
  }

  // Get all workers for a specific wallet address
  async getWorkersByWallet(
    savedBy: string
  ): Promise<{ data: Worker[]; message: string }> {
    return this.makeRequest(`/?${savedBy}`);
  }

  // Search workers
  async searchWorkers(
    query: string,
    savedBy?: string
  ): Promise<{ data: Worker[]; message: string }> {
    const params = new URLSearchParams({ q: query });
    if (savedBy) {
      params.append("savedBy", savedBy);
    }
    return this.makeRequest(`/search?${params.toString()}`);
  }

  // Get worker by ID
  async getWorkerById(id: string): Promise<{ data: Worker; message: string }> {
    return this.makeRequest(`/${id}`);
  }

  // Update worker
  async updateWorker(
    id: string,
    workerData: UpdateWorkerData
  ): Promise<{ data: Worker; message: string }> {
    return this.makeRequest(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(workerData),
    });
  }

  // Delete worker
  async deleteWorker(id: string): Promise<{ message: string }> {
    return this.makeRequest(`/${id}`, {
      method: "DELETE",
    });
  }

  // Get active workers count
  async getActiveWorkersCount(
    savedBy: string
  ): Promise<{ data: number; message: string }> {
    return this.makeRequest(`/count/${savedBy}`);
  }
}

export const apiService = new ApiService();
